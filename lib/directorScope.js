import { CANONICAL_ROSTER } from './canonicalRoster';

function norm(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ')}

export function resolveDirectorScope(user){
  if(!user || user.role!=='director') return user;
  if(user.store && user.store!=='Все магазины') return user;

  const directors=CANONICAL_ROSTER.filter(x=>x.role==='director');
  const exact=directors.find(x=>norm(x.surname)===norm(user.surname) && norm(x.firstname)===norm(user.firstname));
  if(exact) return {...user,city:exact.city,store:exact.store,brand:exact.brand};

  let candidates=directors.filter(x=>norm(x.firstname)===norm(user.firstname));
  if(user.city){const cityMatches=candidates.filter(x=>norm(x.city)===norm(user.city));if(cityMatches.length)candidates=cityMatches;}
  if(user.brand){const brandMatches=candidates.filter(x=>norm(x.brand)===norm(user.brand));if(brandMatches.length)candidates=brandMatches;}

  if(candidates.length===1){const x=candidates[0];return {...user,city:x.city,store:x.store,brand:x.brand,_scopeRecovered:true};}
  return user;
}
