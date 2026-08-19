import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee } from "../../lib/auth";
import { BLOCK_META } from "../../lib/blockMeta";

function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }
function scoreOf(v){ if(typeof v==='number') return v; if(v&&typeof v==='object') return Number(v.score ?? v.percent ?? v.result ?? 0)||0; return 0; }

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Метод не поддерживается"});
  try{
    const user=await requireUser(req,res); if(!user) return;
    const id=String(req.query.id||user.id);
    const roster=await getRoster();
    const employee=roster.find(e=>String(e.id)===id);
    if(!employee) return res.status(404).json({error:"Сотрудник не найден"});
    if(!canViewEmployee(user,employee)) return res.status(403).json({error:"Нет доступа к сотруднику"});

    const [progress,practice,profile]=await Promise.all([
      redis.get("progress-"+id), redis.get("practice-"+id), redis.get("sales-profile-"+id)
    ]);
    const p=progress||{}, pr=practice||{};
    const modules=BLOCK_META.map(b=>({key:b.key,title:b.title,score:scoreOf(p[b.key]),completed:scoreOf(p[b.key])>0}));
    const completed=modules.filter(m=>m.completed);
    const average=completed.length?Math.round(completed.reduce((s,m)=>s+m.score,0)/completed.length):0;
    const weakest=[...completed].sort((a,b)=>a.score-b.score).slice(0,3);
    const strongest=[...completed].sort((a,b)=>b.score-a.score).slice(0,3);
    const practiceEntries=Object.values(pr).flatMap(v=>Array.isArray(v)?v:Object.values(v||{}));
    const practiceDone=practiceEntries.filter(v=>v===true || v?.done===true).length;
    const practiceTotal=practiceEntries.length;
    const attention=[];
    if(completed.length < BLOCK_META.length) attention.push(`Не завершено модулей: ${BLOCK_META.length-completed.length}`);
    if(weakest.some(x=>x.score<70)) attention.push("Есть учебные темы ниже 70%");
    if(practiceTotal && pct(practiceDone,practiceTotal)<70) attention.push("Практика выполнена менее чем на 70%");
    if(!profile) attention.push("Не пройден CRN Sales Profile");

    return res.status(200).json({
      employee:{id:employee.id,name:employee.name,role:employee.role,store:employee.store,city:employee.city,brand:employee.brand},
      academy:{completed:completed.length,total:BLOCK_META.length,completion:pct(completed.length,BLOCK_META.length),average,strongest,weakest,modules},
      practice:{done:practiceDone,total:practiceTotal,completion:pct(practiceDone,practiceTotal),raw:pr},
      salesProfile:profile||null,
      attention,
      status: attention.length===0 ? "stable" : attention.length<=2 ? "watch" : "attention"
    });
  }catch(err){ return res.status(500).json({error:"Не удалось собрать Employee 360",details:String(err)}); }
}
