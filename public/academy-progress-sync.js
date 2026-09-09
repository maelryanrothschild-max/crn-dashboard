(function(){
const KEYS=['crn_client_lab_advanced','crn_microlearning','crn_money_mindset','crn_upt3','crn_sale_reviews','crn_role_academy','crn_material_polyester','crn_material_nylon','crn_material_elastane','crn_material_acrylic','crn_material_denim','crn_material_leather','crn_material_suede','crn_material_composition'];
let last='',busy=false,hydrated=false;
function parse(v){try{return JSON.parse(v)}catch{return null}}
function snapshot(){const out={};KEYS.forEach(k=>{const raw=localStorage.getItem(k);if(raw!==null){const v=parse(raw);if(v!==null)out[k]=v}});return out}
function sig(o){try{return JSON.stringify(o)}catch{return''}}
function merge(remote){if(!remote||typeof remote!=='object')return;KEYS.forEach(k=>{if(!(k in remote))return;const localRaw=localStorage.getItem(k);if(localRaw===null){localStorage.setItem(k,JSON.stringify(remote[k]));return}const local=parse(localRaw),r=remote[k];if(Array.isArray(local)&&Array.isArray(r)){const seen=new Set(),all=[...r,...local].filter(x=>{const key=sig(x);if(seen.has(key))return false;seen.add(key);return true});localStorage.setItem(k,JSON.stringify(all.slice(-100)))}else if(local&&r&&typeof local==='object'&&typeof r==='object'&&!Array.isArray(local)&&!Array.isArray(r)){localStorage.setItem(k,JSON.stringify({...r,...local}))}})}
async function hydrate(){try{const res=await fetch('/api/academy-progress',{credentials:'same-origin'});if(!res.ok)return;const data=await res.json();merge(data.progress);hydrated=true;last=sig(snapshot());await push(true)}catch(e){}}
async function push(force){if(busy||!hydrated)return;const p=snapshot(),s=sig(p);if(!force&&s===last)return;busy=true;try{const res=await fetch('/api/academy-progress',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({progress:p})});if(res.ok){last=s;document.documentElement.dataset.academySynced='1'}}catch(e){}finally{busy=false}}
function status(){return document.documentElement.dataset.academySynced==='1'?'SYNCED':'LOCAL'}
function loadAssignments(){if(document.querySelector('script[data-crn-assignments]'))return;const s=document.createElement('script');s.src='/academy-assignments.js?v=2';s.dataset.crnAssignments='1';document.head.appendChild(s)}
window.CRNAcademyProgress={sync:()=>push(true),snapshot,status};
loadAssignments();setTimeout(hydrate,1200);setInterval(()=>push(false),5000);window.addEventListener('beforeunload',()=>push(false));
})();