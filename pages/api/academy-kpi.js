import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee, isOwnerModerator, safeUser } from "../../lib/auth";

const key=id=>`academy_kpi:${String(id)}`;
const isManager=u=>!!u&&(isOwnerModerator(u)||u.role==="director");
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const clean=(s,n=300)=>String(s||"").trim().slice(0,n);
const pct=(a,b)=>a===null||b===null||a===0?null:Math.round(((b-a)/Math.abs(a))*1000)/10;
async function read(id){const x=await redis.get(key(id));return Array.isArray(x)?x:[]}
async function write(id,items){await redis.set(key(id),items)}
function normalize(body){return{date:clean(body?.date),upt:num(body?.upt),conversion:num(body?.conversion),avgCheck:num(body?.avgCheck),note:clean(body?.note,500)}}
function pair(items){const sorted=[...items].sort((a,b)=>String(a.date).localeCompare(String(b.date)));if(sorted.length<2)return null;const before=sorted[0],after=sorted[sorted.length-1];return{before,after,delta:{upt:pct(before.upt,after.upt),conversion:pct(before.conversion,after.conversion),avgCheck:pct(before.avgCheck,after.avgCheck)}}}
export default async function handler(req,res){
 try{
  const user=await requireUser(req,res);if(!user)return;
  if(!isManager(user))return res.status(403).json({error:"KPI IMPACT доступен руководителям"});
  const roster=await getRoster();
  if(req.method==="GET"){
   const employeeId=clean(req.query.employeeId);
   if(employeeId){const employee=roster.find(e=>String(e.id)===employeeId);if(!employee||!canViewEmployee(user,employee))return res.status(403).json({error:"Нет доступа к сотруднику"});const items=await read(employeeId);return res.status(200).json({employee:safeUser(employee),items,pair:pair(items)});}
   const visible=roster.filter(e=>String(e.id)!==String(user.id)&&canViewEmployee(user,e));
   const rows=await Promise.all(visible.map(async e=>{const items=await read(e.id);return{employee:safeUser(e),items,pair:pair(items)}}));
   return res.status(200).json({rows:rows.filter(r=>r.items.length)});
  }
  if(req.method==="POST"){
   const employeeId=clean(req.body?.employeeId),employee=roster.find(e=>String(e.id)===employeeId);if(!employee||employeeId===String(user.id)||!canViewEmployee(user,employee))return res.status(403).json({error:"Нет доступа к сотруднику"});
   const v=normalize(req.body);if(!/^\d{4}-\d{2}-\d{2}$/.test(v.date))return res.status(400).json({error:"Укажите дату KPI"});if(v.upt===null&&v.conversion===null&&v.avgCheck===null)return res.status(400).json({error:"Укажите хотя бы один KPI"});
   const items=await read(employeeId);const row={id:`k_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,...v,createdAt:new Date().toISOString(),createdBy:{id:String(user.id),firstname:clean(user.firstname),surname:clean(user.surname)}};items.push(row);items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));await write(employeeId,items.slice(-24));return res.status(201).json({item:row,pair:pair(items)});
  }
  if(req.method==="DELETE"){
   const employeeId=clean(req.body?.employeeId),id=clean(req.body?.id),employee=roster.find(e=>String(e.id)===employeeId);if(!employee||!canViewEmployee(user,employee))return res.status(403).json({error:"Нет доступа"});const items=(await read(employeeId)).filter(x=>x.id!==id);await write(employeeId,items);return res.status(200).json({ok:true});
  }
  return res.status(405).json({error:"Метод не поддерживается"});
 }catch(err){return res.status(500).json({error:"Ошибка Academy KPI",details:String(err)});}
}
