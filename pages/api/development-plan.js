import { redis } from '../../lib/redis';
import { requireUser, getRoster, canViewEmployee } from '../../lib/auth';

function scoreOf(v){if(typeof v==='number')return v;if(v&&typeof v==='object')return Number(v.testScore??v.score??v.percent??v.result??0)||0;return 0}
function pct(n,d){return d?Math.round(n/d*100):0}
function practiceStats(raw){
 const vals=[];
 for(const v of Object.values(raw||{})){
  if(Array.isArray(v?.done)) vals.push(...v.done.map(Boolean));
  else if(Array.isArray(v)) vals.push(...v.map(Boolean));
  else if(v&&typeof v==='object') for(const x of Object.values(v)){
   if(Array.isArray(x?.done)) vals.push(...x.done.map(Boolean));
   else if(typeof x==='boolean') vals.push(x);
  }
 }
 return {done:vals.filter(Boolean).length,total:vals.length};
}
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Метод не поддерживается'});
 try{
  const user=await requireUser(req,res);if(!user)return;
  const id=String(req.query.id||user.id);const roster=await getRoster();const e=roster.find(x=>String(x.id)===id);
  if(!e)return res.status(404).json({error:'Сотрудник не найден'});if(!canViewEmployee(user,e))return res.status(403).json({error:'Нет доступа'});
  const [progress,practice,profile]=await Promise.all([redis.get('progress-'+id),redis.get('practice-'+id),redis.get('sales-profile-'+id)]);
  const p=progress||{};const weak=Object.entries(p).map(([k,v])=>({key:k,score:scoreOf(v)})).filter(x=>x.score>0).sort((a,b)=>a.score-b.score).slice(0,3);
  const ps=practiceStats(practice||{});
  const focus=weak.length?`Повторить слабые учебные темы (${weak.map(x=>x.score+'%').join(', ')})`:'Закрепить технику продажи через практику';
  const seven=[
   {day:'День 1',task:'Разобрать с директором один реальный диалог с клиентом и выбрать 1 навык для фокуса.'},
   {day:'Дни 2–3',task:'Применить выбранный навык минимум в 5 клиентских диалогах и зафиксировать результат.'},
   {day:'День 4',task:focus+'.'},
   {day:'Дни 5–6',task:'Собрать минимум 3 Complete Look и каждый раз предложить дополнительную категорию без решения за клиента.'},
   {day:'День 7',task:'15-минутная встреча с директором: что получилось, где возникло сопротивление, что закрепляем дальше.'}
  ];
  const thirty=[
   {week:'Неделя 1',goal:'Осознанная техника',task:'Выполнить 7-дневный план и закрыть незавершённую практику.'},
   {week:'Неделя 2',goal:'Уверенность и допродажа',task:'Тренировать Complete Look, альтернативы и предложение более высокой ценности.'},
   {week:'Неделя 3',goal:'Работа с клиентом',task:'Отработать типы клиентов, возражения, эмоциональную устойчивость и сервис.'},
   {week:'Неделя 4',goal:'Закрепление результата',task:'Повторный тест слабых тем + наблюдение директора + сравнение динамики.'}
  ];
  return res.status(200).json({employee:{id:e.id,name:e.name||[e.surname,e.firstname].filter(Boolean).join(' '),store:e.store},snapshot:{practice:pct(ps.done,ps.total),practiceDone:ps.done,practiceTotal:ps.total,salesProfileCompleted:!!profile},sevenDays:seven,thirtyDays:thirty,disclaimer:'План развития основан на учебных и практических данных и не является психологическим диагнозом.'});
 }catch(err){return res.status(500).json({error:'Не удалось сформировать план',details:String(err)})}
}