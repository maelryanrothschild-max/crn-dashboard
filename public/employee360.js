(()=>{
 const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function current(){try{const r=await fetch('/api/me',{credentials:'include'});return r.ok?(await r.json()).user:null}catch{return null}}
 function isAuthenticatedScreen(u){
   if(!u) return false;
   const text=(document.body?.innerText||'').toLowerCase();
   const first=String(u.firstname||'').toLowerCase();
   const last=String(u.surname||'').toLowerCase();
   return (!!first && text.includes(first)) || (!!last && text.includes(last)) || text.includes('выйти') || text.includes('прогресс команды');
 }
 async function open360(id){
  let ov=document.getElementById('e360-overlay'); if(!ov){ov=document.createElement('div');ov.id='e360-overlay';ov.style.cssText='position:fixed;inset:0;background:#050914ee;z-index:99997;overflow:auto;padding:24px';document.body.appendChild(ov)}
  ov.innerHTML='<div style="max-width:1000px;margin:auto;color:white">Загрузка Employee 360…</div>';
  const r=await fetch('/api/employee360?id='+encodeURIComponent(id),{credentials:'include'});const d=await r.json();
  if(!r.ok){ov.innerHTML='<div style="color:white">'+esc(d.error)+' <button onclick="document.getElementById(\'e360-overlay\').remove()">Закрыть</button></div>';return}
  const a=d.academy, p=d.practice, sp=d.salesProfile;
  const bars=(sp?.scores||sp?.dimensions||{}); const barHtml=Object.entries(bars).map(([k,v])=>`<div style="margin:7px 0"><span>${esc(k)}</span><b style="float:right">${esc(typeof v==='object'?(v.score??v.percent):v)}%</b></div>`).join('')||'<div style="opacity:.6">Sales Profile ещё не пройден</div>';
  ov.innerHTML=`<div style="max-width:1000px;margin:auto;color:#fff;font-family:Arial"><div style="display:flex;justify-content:space-between;align-items:center"><div><h1 style="margin-bottom:4px">Employee 360°</h1><div style="opacity:.65">${esc(d.employee.name)} · ${esc(d.employee.role)} · ${esc(d.employee.store)}</div></div><button id="e360-close" style="padding:10px 16px;border-radius:10px">Закрыть</button></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:24px 0"><div class="e360c"><b>Академия</b><div class="e360n">${a.completion}%</div><small>${a.completed}/${a.total} модулей</small></div><div class="e360c"><b>Средний балл</b><div class="e360n">${a.average}%</div></div><div class="e360c"><b>Практика</b><div class="e360n">${p.completion}%</div><small>${p.done}/${p.total}</small></div><div class="e360c"><b>Статус</b><div class="e360n" style="font-size:22px">${d.status==='stable'?'Стабильно':d.status==='watch'?'Наблюдение':'Зона внимания'}</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><section class="e360c"><h3>Сильные учебные темы</h3>${a.strongest.map(x=>`<p>${esc(x.title)} <b style="float:right">${x.score}%</b></p>`).join('')||'Нет данных'}<h3>Зоны развития</h3>${a.weakest.map(x=>`<p>${esc(x.title)} <b style="float:right">${x.score}%</b></p>`).join('')||'Нет данных'}</section><section class="e360c"><h3>CRN Sales Profile</h3>${barHtml}</section></div>
  <section class="e360c" style="margin-top:16px"><h3>Зона внимания CRINOO</h3>${d.attention.length?d.attention.map(x=>`<p>• ${esc(x)}</p>`).join(''):'<p>Критических сигналов нет.</p>'}<button id="e360-ai" style="margin-top:10px;padding:12px 16px;border:0;border-radius:10px;font-weight:700">Сформировать план развития</button><pre id="e360-aiout" style="white-space:pre-wrap;font-family:inherit;line-height:1.5"></pre></section></div>`;
  ov.querySelectorAll('.e360c').forEach(x=>x.style.cssText+=';background:#111827;border:1px solid #263247;border-radius:16px;padding:18px');ov.querySelectorAll('.e360n').forEach(x=>x.style.cssText='font-size:32px;font-weight:800;margin-top:10px');
  document.getElementById('e360-close').onclick=()=>ov.remove();
  document.getElementById('e360-ai').onclick=async()=>{const out=document.getElementById('e360-aiout');out.textContent='CRINOO анализирует данные…';const rr=await fetch('/api/ai/analyze-employee',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({id})});const z=await rr.json();out.textContent=z.analysis||z.report||z.error||JSON.stringify(z,null,2)};
 }
 function mountPanel(u){
   if(document.getElementById('crn-development-panel')) return;
   const root=document.querySelector('#__next'); if(!root) return;
   const panel=document.createElement('section'); panel.id='crn-development-panel';
   panel.style.cssText='max-width:960px;margin:18px auto;padding:16px 18px;background:#fff;border:1px solid #e6dfd1;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.06);font-family:inherit';
   panel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><div style="font-weight:800;color:#1B2436;font-size:16px">Моё развитие</div><div style="font-size:12px;color:#777;margin-top:3px">${esc(u.firstname||'')} ${esc(u.surname||'')} · ${esc(u.store||'')}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="crn-in-practice" style="padding:9px 12px;border:0;border-radius:6px;background:#1B2436;color:#fff;font-weight:700;cursor:pointer">Практика</button><button id="crn-in-sales" style="padding:9px 12px;border:0;border-radius:6px;background:#A9812E;color:#fff;font-weight:700;cursor:pointer">Sales Profile</button><button id="crn-in-360" style="padding:9px 12px;border:1px solid #1B2436;border-radius:6px;background:#fff;color:#1B2436;font-weight:700;cursor:pointer">Employee 360°</button></div></div>`;
   const first=root.firstElementChild; if(first) root.insertBefore(panel,first.nextSibling); else root.appendChild(panel);
   document.getElementById('crn-in-practice').onclick=()=>window.openCRNPractice&&window.openCRNPractice();
   document.getElementById('crn-in-sales').onclick=()=>window.openCRNSalesProfile&&window.openCRNSalesProfile();
   document.getElementById('crn-in-360').onclick=()=>open360(u.id);
 }
 async function boot(){const u=await current();if(!u||!isAuthenticatedScreen(u))return;window.openEmployee360=open360;mountPanel(u)}
 setInterval(boot,1800);setTimeout(boot,1000);
})();