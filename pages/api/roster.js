import { redis } from "../../lib/redis";
import { requireUser, safeUser, isOwnerModerator, getRoster } from "../../lib/auth";

const ALLOWED_ROLES = new Set(["stylist", "admin", "online_manager", "director"]);
const STAFF_ADD_ROLES = new Set(["stylist", "admin", "online_manager"]);
const norm = (v) => String(v || "").trim().toLocaleLowerCase("ru-RU");
function normalizeRole(role){const v=String(role||"").trim().toLowerCase();if(["stylist","стилист","стилист-консультант"].includes(v))return"stylist";if(["admin","administrator","админ","администратор"].includes(v))return"admin";if(["online_manager","online manager","онлайн-менеджер","онлайн менеджер"].includes(v))return"online_manager";if(["director","директор","директор магазина"].includes(v))return"director";return null;}
function isRegionalDirector(user){return !!user&&user.role==="director"&&user.store==="Все магазины"&&!!user.brand;}
function sameStore(a,b){return !!a?.store&&a.store!=="Все магазины"&&norm(a.store)===norm(b?.store);}
function visibleRoster(user,roster){
  if(isOwnerModerator(user))return roster.map(safeUser);
  if(isRegionalDirector(user))return roster.filter(e=>norm(e.brand)===norm(user.brand)).map(safeUser);
  if(user.store&&user.store!=="Все магазины")return roster.filter(e=>sameStore(user,e)).map(safeUser);
  return roster.filter(e=>String(e.id)===String(user.id)).map(safeUser);
}
function canManage(user,target){
  if(!user||!target)return false;
  if(isOwnerModerator(user))return target.role!=="moderator";
  if(String(user.id)===String(target.id))return false;
  if(target.role==="moderator"||target.role==="director")return false;
  if(isRegionalDirector(user))return norm(user.brand)===norm(target.brand);
  return sameStore(user,target);
}
function nextPin(roster){const maxPin=roster.reduce((m,e)=>Math.max(m,parseInt(e.pin,10)||1000),1000);return String(maxPin+1);}
function cleanEmployeeInput(emp,user){
  if(!emp||!emp.surname||!emp.firstname)return{error:"Укажите имя и фамилию сотрудника"};
  const role=normalizeRole(emp.role);if(!role||!ALLOWED_ROLES.has(role))return{error:"Неизвестная роль сотрудника"};
  if(!isOwnerModerator(user)&&!STAFF_ADD_ROLES.has(role))return{error:"Можно добавлять стилистов, администраторов и онлайн-менеджеров"};
  const regional=isRegionalDirector(user);
  const store=isOwnerModerator(user)||regional?String(emp.store||"").trim():String(user.store||"").trim();
  if(!store||store==="Все магазины")return{error:"Для сотрудника должен быть указан конкретный магазин"};
  const brand=isOwnerModerator(user)?String(emp.brand||"").trim():String(user.brand||"").trim();
  return{value:{surname:String(emp.surname).trim(),firstname:String(emp.firstname).trim(),role,city:String(emp.city||user.city||"").trim(),store,brand}};
}
function findDuplicate(roster,emp){const s=emp.surname.toLowerCase(),f=emp.firstname.toLowerCase(),store=emp.store.toLowerCase();return roster.find(e=>String(e.surname||"").trim().toLowerCase()===s&&String(e.firstname||"").trim().toLowerCase()===f&&String(e.store||"").trim().toLowerCase()===store);}

export default async function handler(req,res){
 try{
  const user=await requireUser(req,res);if(!user)return;let roster=await getRoster();
  if(req.method==="GET")return res.status(200).json({roster:visibleRoster(user,roster)});
  if(req.method!=="POST")return res.status(405).json({error:"Метод не поддерживается"});
  const {action,employee,employees,id}=req.body||{};
  if(action==="add"){
    const cleaned=cleanEmployeeInput(employee,user);if(cleaned.error)return res.status(400).json({error:cleaned.error});if(findDuplicate(roster,cleaned.value))return res.status(409).json({error:"Такой сотрудник уже есть в этом магазине"});
    const pin=nextPin(roster);const rec={id:pin,pin,...cleaned.value};roster.push(rec);await redis.set("roster",roster);return res.status(200).json({roster:visibleRoster(user,roster),added:safeUser(rec),temporaryPin:pin});
  }
  if(action==="bulkAdd"){
    const added=[],skipped=[];let maxPin=roster.reduce((m,e)=>Math.max(m,parseInt(e.pin,10)||1000),1000);
    for(const raw of employees||[]){const cleaned=cleanEmployeeInput(raw,user);if(cleaned.error){skipped.push({employee:raw,reason:cleaned.error});continue;}const duplicate=findDuplicate(roster,cleaned.value);if(duplicate){skipped.push({employee:raw,reason:"Сотрудник уже существует",existingId:duplicate.id});continue;}maxPin+=1;const pin=String(maxPin);const rec={id:pin,pin,...cleaned.value};roster.push(rec);added.push({...safeUser(rec),temporaryPin:pin});}
    await redis.set("roster",roster);return res.status(200).json({roster:visibleRoster(user,roster),added,skipped});
  }
  if(action==="remove"){
    const target=roster.find(e=>String(e.id)===String(id));if(!target)return res.status(404).json({error:"Сотрудник не найден"});
    if(!canManage(user,target))return res.status(403).json({error:"Можно удалять только сотрудников своей команды. Директора и модератор защищены."});
    roster=roster.filter(e=>String(e.id)!==String(id));
    const terminatedRaw=await redis.get("terminated_roster_ids");const terminated=new Set(Array.isArray(terminatedRaw)?terminatedRaw.map(String):[]);terminated.add(String(id));
    await Promise.all([redis.set("roster",roster),redis.set("terminated_roster_ids",Array.from(terminated))]);
    return res.status(200).json({roster:visibleRoster(user,roster)});
  }
  if(!isOwnerModerator(user))return res.status(403).json({error:"Изменение данных существующих сотрудников доступно только модератору"});
  if(action==="update"){
    const target=roster.find(e=>String(e.id)===String(id));if(!target)return res.status(404).json({error:"Сотрудник не найден"});if(target.role==="moderator")return res.status(403).json({error:"Учётная запись модератора защищена"});
    const patch={...employee};delete patch.id;delete patch.pin;delete patch.password;if(patch.role){const role=normalizeRole(patch.role);if(!role||!ALLOWED_ROLES.has(role))return res.status(400).json({error:"Неизвестная роль"});patch.role=role;}if(patch.store==="Все магазины")return res.status(400).json({error:"У сотрудника должен быть конкретный магазин"});roster=roster.map(e=>String(e.id)===String(id)?{...e,...patch}:e);
    await redis.set("roster",roster);return res.status(200).json({roster:visibleRoster(user,roster)});
  }
  return res.status(400).json({error:"Неизвестное действие"});
 }catch(err){return res.status(500).json({error:"Ошибка базы данных",details:String(err)});}
}