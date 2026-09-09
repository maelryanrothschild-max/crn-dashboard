import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee, isOwnerModerator, safeUser } from "../../lib/auth";

const key=id=>`academy_assignments:${String(id)}`;
const isManager=u=>!!u&&(isOwnerModerator(u)||u.role==="director");
const allowedModules=["CLIENT LAB","MICRO LEARNING","MONEY MINDSET","UPT 3.0","SALE REVIEW","ROLE MISSION","PRODUCT INTELLIGENCE"];
const clean=(s,n=300)=>String(s||"").trim().slice(0,n);
async function read(id){const x=await redis.get(key(id));return Array.isArray(x)?x:[]}
async function write(id,items){await redis.set(key(id),items)}

export default async function handler(req,res){
 try{
  const user=await requireUser(req,res);if(!user)return;
  const roster=await getRoster();
  if(req.method==="GET"){
   const employeeId=String(req.query.employeeId||user.id);
   if(employeeId!==String(user.id)&&!isManager(user))return res.status(403).json({error:"Нет доступа"});
   const employee=roster.find(e=>String(e.id)===employeeId);
   if(!employee)return res.status(404).json({error:"Сотрудник не найден"});
   if(employeeId!==String(user.id)&&!canViewEmployee(user,employee))return res.status(403).json({error:"Нет доступа к сотруднику"});
   const items=await read(employeeId);
   return res.status(200).json({employee:safeUser(employee),items:items.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))});
  }
  if(req.method==="POST"){
   if(!isManager(user))return res.status(403).json({error:"Назначать обучение может руководитель"});
   const employeeId=String(req.body?.employeeId||"");const employee=roster.find(e=>String(e.id)===employeeId);
   if(!employee||employeeId===String(user.id)||!canViewEmployee(user,employee))return res.status(403).json({error:"Нет доступа к сотруднику"});
   const module=clean(req.body?.module).toUpperCase();if(!allowedModules.includes(module))return res.status(400).json({error:"Неизвестный модуль"});
   const dueDate=clean(req.body?.dueDate);if(!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))return res.status(400).json({error:"Укажите дедлайн"});
   const items=await read(employeeId);const now=new Date().toISOString();
   const item={id:`a_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,module,task:clean(req.body?.task)||`Пройти ${module} и применить навык на смене`,dueDate,status:"assigned",createdAt:now,assignedBy:{id:String(user.id),surname:clean(user.surname),firstname:clean(user.firstname)}};
   items.unshift(item);await write(employeeId,items.slice(0,50));return res.status(201).json({item});
  }
  if(req.method==="PATCH"){
   const employeeId=String(req.body?.employeeId||user.id),id=clean(req.body?.id),action=clean(req.body?.action);
   const employee=roster.find(e=>String(e.id)===employeeId);if(!employee)return res.status(404).json({error:"Сотрудник не найден"});
   const own=employeeId===String(user.id);if(!own&&(!isManager(user)||!canViewEmployee(user,employee)))return res.status(403).json({error:"Нет доступа"});
   const items=await read(employeeId),item=items.find(x=>x.id===id);if(!item)return res.status(404).json({error:"Назначение не найдено"});
   const now=new Date().toISOString();
   if(action==="complete"&&own){if(item.status!=="assigned"&&item.status!=="revision")return res.status(400).json({error:"Назначение уже отправлено на проверку"});item.status="pending_review";item.completedAt=now;delete item.reviewedAt;delete item.reviewedBy}
   else if(action==="approve"&&isManager(user)&&!own){if(item.status!=="pending_review")return res.status(400).json({error:"Задание не ожидает проверки"});item.status="approved";item.reviewedAt=now;item.managerComment=clean(req.body?.comment,500);item.reviewedBy={id:String(user.id),surname:clean(user.surname),firstname:clean(user.firstname)}}
   else if(action==="revision"&&isManager(user)&&!own){if(item.status!=="pending_review")return res.status(400).json({error:"Задание не ожидает проверки"});const comment=clean(req.body?.comment,500);if(!comment)return res.status(400).json({error:"Напишите, что нужно доработать"});item.status="revision";item.managerComment=comment;item.reviewedAt=now;item.reviewedBy={id:String(user.id),surname:clean(user.surname),firstname:clean(user.firstname)};delete item.completedAt}
   else if(action==="reopen"&&isManager(user)&&!own){item.status="assigned";delete item.completedAt;delete item.reviewedAt;delete item.reviewedBy;delete item.managerComment}
   else return res.status(400).json({error:"Недоступное действие"});
   await write(employeeId,items);return res.status(200).json({item});
  }
  return res.status(405).json({error:"Метод не поддерживается"});
 }catch(err){return res.status(500).json({error:"Ошибка Academy Assignments",details:String(err)});}
}
