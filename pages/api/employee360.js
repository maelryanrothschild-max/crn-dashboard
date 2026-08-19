import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee } from "../../lib/auth";
import { BLOCK_META } from "../../lib/blockMeta";

function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }
function scoreOf(v){ if(typeof v==='number') return v; if(v&&typeof v==='object') return Number(v.testScore ?? v.score ?? v.percent ?? v.result ?? 0)||0; return 0; }
function practiceStats(raw){
  const vals=[];
  for(const v of Object.values(raw||{})){
    if(Array.isArray(v?.done)) vals.push(...v.done.map(Boolean));
    else if(Array.isArray(v)) vals.push(...v.map(Boolean));
    else if(v && typeof v === 'object'){
      for(const x of Object.values(v)){
        if(Array.isArray(x?.done)) vals.push(...x.done.map(Boolean));
        else if(typeof x === 'boolean') vals.push(x);
      }
    }
  }
  return {done:vals.filter(Boolean).length,total:vals.length};
}

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
    const ps=practiceStats(pr);
    const attention=[];
    if(completed.length < BLOCK_META.length) attention.push(`Не завершено модулей: ${BLOCK_META.length-completed.length}`);
    if(weakest.some(x=>x.score<70)) attention.push("Есть учебные темы ниже 70%");
    if(ps.total && pct(ps.done,ps.total)<70) attention.push("Практика выполнена менее чем на 70%");
    if(!profile) attention.push("Не пройден CRN Sales Profile");

    return res.status(200).json({
      employee:{id:employee.id,name:employee.name || [employee.surname,employee.firstname].filter(Boolean).join(' '),role:employee.role,store:employee.store,city:employee.city,brand:employee.brand},
      academy:{completed:completed.length,total:BLOCK_META.length,completion:pct(completed.length,BLOCK_META.length),average,strongest,weakest,modules},
      practice:{done:ps.done,total:ps.total,completion:pct(ps.done,ps.total),raw:pr},
      salesProfile:profile||null,
      attention,
      status: attention.length===0 ? "stable" : attention.length<=2 ? "watch" : "attention"
    });
  }catch(err){ return res.status(500).json({error:"Не удалось собрать Employee 360",details:String(err)}); }
}
