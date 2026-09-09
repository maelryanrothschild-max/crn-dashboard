import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee, isOwnerModerator } from "../../lib/auth";

const PROGRESS_KEYS=["crn_client_lab_advanced","crn_micro_learning","crn_money_mindset","crn_upt3","crn_sale_reviews","crn_role_academy","crn_material_polyester","crn_material_nylon","crn_material_elastane","crn_material_acrylic","crn_material_denim","crn_material_leather","crn_material_suede","crn_material_composition"];
const pKey=id=>`academy_progress:${String(id)}`;
const aKey=id=>`academy_assignments:${String(id)}`;
const obj=(p,k)=>p&&p[k]&&typeof p[k]==="object"?p[k]:{};
const count=o=>Array.isArray(o)?o.length:Object.keys(o||{}).length;
function evidence(progress={}){
 const lab=Object.values(obj(progress,"crn_client_lab_advanced")).filter(x=>x&&x.passed).length;
 const micro=count(obj(progress,"crn_micro_learning")),money=count(obj(progress,"crn_money_mindset")),upt=count(obj(progress,"crn_upt3"));
 const sale=count(progress.crn_sale_reviews||{}),role=Object.values(obj(progress,"crn_role_academy")).filter(x=>x&&x.done).length;
 const materials=PROGRESS_KEYS.filter(k=>k.startsWith("crn_material_")).reduce((n,k)=>n+(progress[k]?1:0),0);
 return{lab,micro,money,upt,sale,role,materials};
}
function score(e){return Math.min(100,Math.min(20,e.lab*3)+Math.min(15,e.micro*3)+Math.min(15,e.money*3)+Math.min(15,e.upt*3)+Math.min(15,e.sale*5)+Math.min(20,e.role*5))}
function level(s){if(s>=100)return"EXPERT";if(s>=75)return"PREMIUM STYLIST";if(s>=50)return"SENIOR STYLIST";if(s>=25)return"CERTIFIED STYLIST";return"TRAINEE"}
function gaps(e){const g=[];if(e.lab<3)g.push("CLIENT LAB");if(e.micro<3)g.push("MICRO LEARNING");if(e.money<3)g.push("MONEY MINDSET");if(e.upt<3)g.push("UPT 3.0");if(e.sale<1)g.push("SALE REVIEW");if(e.role<1)g.push("ROLE MISSION");if(e.materials<4)g.push("PRODUCT INTELLIGENCE");return g}
function isManager(u){return !!u&&(isOwnerModerator(u)||u.role==="director")}
function group(rows,key){
 const map=new Map();for(const r of rows){const name=String(r.employee?.[key]||"Не указано");if(!map.has(name))map.set(name,[]);map.get(name).push(r)}
 return [...map.entries()].map(([name,items])=>{const assignments=items.flatMap(x=>x.assignments||[]),approved=assignments.filter(a=>a.status==="approved").length,total=assignments.length;return{name,employees:items.length,avgProgress:items.length?Math.round(items.reduce((n,x)=>n+x.score,0)/items.length):0,assignmentCompletion:total?Math.round(approved/total*100):0,overdue:assignments.filter(a=>(a.status==="assigned"||a.status==="revision")&&a.dueDate&&a.dueDate<new Date().toISOString().slice(0,10)).length,pendingReview:assignments.filter(a=>a.status==="pending_review").length}}).sort((a,b)=>b.avgProgress-a.avgProgress)
}
export default async function handler(req,res){
 try{
  const user=await requireUser(req,res);if(!user)return;
  if(req.method!=="GET")return res.status(405).json({error:"Метод не поддерживается"});
  if(!isManager(user))return res.status(403).json({error:"ACADEMY ANALYTICS доступен руководителям"});
  const roster=await getRoster(),visible=roster.filter(e=>String(e.id)!==String(user.id)&&canViewEmployee(user,e));
  const rows=await Promise.all(visible.map(async employee=>{const [pr,ar]=await Promise.all([redis.get(pKey(employee.id)),redis.get(aKey(employee.id))]);const ev=evidence(pr?.progress||{}),s=score(ev);return{employee,score:s,level:level(s),gaps:gaps(ev),updatedAt:pr?.updatedAt||null,assignments:Array.isArray(ar)?ar:[]}}));
  const assignments=rows.flatMap(r=>r.assignments),today=new Date().toISOString().slice(0,10),approved=assignments.filter(a=>a.status==="approved").length,total=assignments.length;
  const overdue=assignments.filter(a=>(a.status==="assigned"||a.status==="revision")&&a.dueDate&&a.dueDate<today).length,pendingReview=assignments.filter(a=>a.status==="pending_review").length,revision=assignments.filter(a=>a.status==="revision").length;
  const gapCounts={};rows.forEach(r=>r.gaps.forEach(g=>gapCounts[g]=(gapCounts[g]||0)+1));
  const gapsTop=Object.entries(gapCounts).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const levels={"TRAINEE":0,"CERTIFIED STYLIST":0,"SENIOR STYLIST":0,"PREMIUM STYLIST":0,"EXPERT":0};rows.forEach(r=>levels[r.level]=(levels[r.level]||0)+1);
  const recent30=rows.filter(r=>r.updatedAt&&Date.now()-new Date(r.updatedAt).getTime()<=30*86400000).length;
  return res.status(200).json({summary:{employees:rows.length,avgProgress:rows.length?Math.round(rows.reduce((n,r)=>n+r.score,0)/rows.length):0,assignmentCompletion:total?Math.round(approved/total*100):0,approved,total,overdue,pendingReview,revision,active30:recent30},levels,gaps:gapsTop,stores:group(rows,"store"),brands:group(rows,"brand"),note:"Влияние обучения на UPT, конверсию и средний чек требует связки с историческими KPI по сотруднику/магазину. Academy Analytics сейчас показывает учебное поведение и выполнение."});
 }catch(err){return res.status(500).json({error:"Ошибка Academy Analytics",details:String(err)})}
}
