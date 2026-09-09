import { redis } from "../../lib/redis";
import { requireUser, getRoster, canViewEmployee } from "../../lib/auth";

const KEYS = [
  "crn_client_lab_advanced","crn_micro_learning","crn_money_mindset","crn_upt3",
  "crn_sale_reviews","crn_role_academy","crn_material_polyester","crn_material_nylon",
  "crn_material_elastane","crn_material_acrylic","crn_material_denim","crn_material_leather",
  "crn_material_suede","crn_material_composition"
];
const dbKey = (id) => `academy_progress:${String(id)}`;
function cleanSnapshot(input){
  const out={};
  if(!input || typeof input!=="object" || Array.isArray(input)) return out;
  for(const k of KEYS){
    if(!(k in input)) continue;
    const raw=input[k];
    try{
      const text=JSON.stringify(raw);
      if(text.length<=50000) out[k]=raw;
    }catch{}
  }
  return out;
}
export default async function handler(req,res){
  try{
    const user=await requireUser(req,res); if(!user)return;
    if(req.method==="GET"){
      const requested=String(req.query?.userId||user.id);
      const roster=await getRoster();
      const target=roster.find(e=>String(e.id)===requested);
      if(!target)return res.status(404).json({error:"Сотрудник не найден"});
      if(!canViewEmployee(user,target))return res.status(403).json({error:"Нет доступа к прогрессу сотрудника"});
      const record=await redis.get(dbKey(requested));
      return res.status(200).json({userId:requested,progress:record?.progress||{},updatedAt:record?.updatedAt||null});
    }
    if(req.method==="POST"){
      const progress=cleanSnapshot(req.body?.progress);
      const record={progress,updatedAt:new Date().toISOString()};
      await redis.set(dbKey(user.id),record);
      return res.status(200).json({ok:true,userId:String(user.id),updatedAt:record.updatedAt});
    }
    return res.status(405).json({error:"Метод не поддерживается"});
  }catch(err){
    return res.status(500).json({error:"Ошибка сохранения прогресса",details:String(err)});
  }
}
