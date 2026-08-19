import { redis } from "../../lib/redis";
import { requireUser, getRoster, isOwnerModerator } from "../../lib/auth";
import { BLOCK_META } from "../../lib/blockMeta";

function scoreOf(v){
  if(typeof v === "number") return v;
  if(v && typeof v === "object") return Number(v.testScore ?? v.score ?? v.percent ?? v.result ?? 0) || 0;
  return 0;
}
function practiceStats(raw){
  const vals=[];
  for(const v of Object.values(raw||{})){
    if(Array.isArray(v?.done)) vals.push(...v.done.map(Boolean));
    else if(Array.isArray(v)) vals.push(...v.map(Boolean));
    else if(v && typeof v === "object") for(const x of Object.values(v)){
      if(Array.isArray(x?.done)) vals.push(...x.done.map(Boolean));
      else if(typeof x === "boolean") vals.push(x);
    }
  }
  return {done:vals.filter(Boolean).length,total:vals.length};
}

export default async function handler(req,res){
  if(req.method !== "GET") return res.status(405).json({error:"Метод не поддерживается"});
  try{
    const user=await requireUser(req,res); if(!user) return;
    if(user.role !== "director" && !isOwnerModerator(user)) return res.status(403).json({error:"Раздел доступен директору и модератору"});
    const roster=await getRoster();
    const visible=isOwnerModerator(user)
      ? roster.filter(e=>e.role !== "moderator")
      : roster.filter(e=>e.store && e.store===user.store && String(e.id)!==String(user.id));

    const rows=await Promise.all(visible.map(async emp=>{
      const [progress,practice,profile]=await Promise.all([
        redis.get("progress-"+emp.id), redis.get("practice-"+emp.id), redis.get("sales-profile-"+emp.id)
      ]);
      const p=progress||{};
      const modules=BLOCK_META.map(b=>({title:b.title,score:scoreOf(p[b.key])}));
      const completed=modules.filter(x=>x.score>0);
      const avg=completed.length?Math.round(completed.reduce((s,x)=>s+x.score,0)/completed.length):0;
      const weakest=[...completed].sort((a,b)=>a.score-b.score).slice(0,2);
      const ps=practiceStats(practice||{});
      const practicePct=ps.total?Math.round(ps.done/ps.total*100):0;
      const signals=[];
      let priority=0;
      const missing=BLOCK_META.length-completed.length;
      if(missing>0){signals.push(`Не завершено модулей: ${missing}`);priority+=Math.min(35,missing*3)}
      if(completed.length && avg<70){signals.push(`Средний балл ${avg}%`);priority+=35}
      else if(completed.length && avg<80){signals.push(`Средний балл ${avg}% — стоит усилить`);priority+=18}
      if(weakest[0] && weakest[0].score<70){signals.push(`Слабая тема: ${weakest[0].title} — ${weakest[0].score}%`);priority+=20}
      if(ps.total && practicePct<70){signals.push(`Практика ${practicePct}%`);priority+=20}
      if(!profile){signals.push("Не пройден Sales Profile");priority+=12}
      if(!completed.length){signals.push("Обучение ещё не начато");priority+=25}
      return {
        id:emp.id,name:[emp.surname,emp.firstname].filter(Boolean).join(" ")||emp.name||String(emp.id),
        role:emp.role,store:emp.store,city:emp.city,brand:emp.brand,
        completion:Math.round(completed.length/BLOCK_META.length*100),average:avg,practice:practicePct,
        hasSalesProfile:!!profile,weakest,signals,priority
      };
    }));

    rows.sort((a,b)=>b.priority-a.priority || a.name.localeCompare(b.name,"ru"));
    return res.status(200).json({
      scope:isOwnerModerator(user)?"network":user.store,
      total:rows.length,
      attention:rows.filter(x=>x.priority>0).slice(0,isOwnerModerator(user)?20:8),
      stable:rows.filter(x=>x.priority===0).length
    });
  }catch(err){ return res.status(500).json({error:"Не удалось сформировать зону внимания",details:String(err)}); }
}
