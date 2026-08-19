(()=>{
  if(window.__CRN_ATTENTION_LOADED__) return;
  window.__CRN_ATTENTION_LOADED__=true;
  const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mounting=false;
  async function me(){try{const r=await fetch('/api/me',{credentials:'same-origin'});if(!r.ok)return null;return (await r.json()).user}catch{return null}}
  function roleName(r){return ({stylist:'Стилист',admin:'Администратор',director:'Директор',online_manager:'Онлайн-менеджер'})[r]||r||'—'}
  function removeDuplicates(){
    const all=[...document.querySelectorAll('#crn-attention-panel,[data-crn-attention="1"]')];
    all.slice(1).forEach(x=>x.remove());
    return all[0]||null;
  }
  async function mount(){
    if(mounting)return; mounting=true;
    try{
      const user=await me();
      let old=removeDuplicates();
      if(!user || !['director','moderator'].includes(user.role)){if(old)old.remove();return;}
      const main=document.querySelector('main'); if(!main)return;
      if(old && old.isConnected)return;
      const r=await fetch('/api/attention',{credentials:'same-origin'}); if(!r.ok)return;
      const d=await r.json();
      removeDuplicates();
      if(document.getElementById('crn-attention-panel'))return;
      const box=document.createElement('section');box.id='crn-attention-panel';box.dataset.crnAttention='1';box.className='panel';box.style.cssText='margin-bottom:22px;border-top:4px solid #A9812E';
      const title=user.role==='director'?'Зона внимания CRINOO · мой магазин':'Зона внимания CRINOO · сеть';
      box.innerHTML=`<div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-bottom:6px">${title}</h2><div style="color:#6B6B6B;font-size:13px">CRINOO показывает, кому сегодня нужна помощь в обучении и практике. Это приоритет для коучинга, а не кадровая оценка.</div></div><div style="text-align:right"><b style="font-size:24px;color:#1B2436">${d.attention.length}</b><div style="font-size:11px;color:#6B6B6B;text-transform:uppercase">в зоне внимания</div></div></div><div id="crn-attention-list" style="margin-top:18px"></div>`;
      const list=box.querySelector('#crn-attention-list');
      if(!d.attention.length){list.innerHTML='<div style="padding:16px;background:#E4F0E7;color:#3E7A52;border-radius:8px">Критических учебных сигналов сейчас нет.</div>'}
      else list.innerHTML=d.attention.map((x,i)=>`<div style="display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(240px,2fr) auto;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid #EEE9DD"><div><b style="color:#1B2436">${i+1}. ${esc(x.name)}</b><div style="font-size:12px;color:#6B6B6B;margin-top:4px">${esc(roleName(x.role))} · ${esc(x.store)}</div></div><div><div style="font-size:13px;line-height:1.55">${x.signals.map(s=>`<span style="display:inline-block;margin:2px 6px 2px 0;padding:4px 7px;border-radius:10px;background:#FFF8E8;color:#7A5B18">${esc(s)}</span>`).join('')}</div><div style="font-size:12px;color:#6B6B6B;margin-top:5px">Академия ${x.completion}% · средний балл ${x.average||'—'}% · практика ${x.practice}%</div></div><button data-e360="${esc(x.id)}" style="border:0;background:#1B2436;color:#fff;padding:9px 12px;border-radius:6px;cursor:pointer;white-space:nowrap">Открыть 360°</button></div>`).join('');
      main.prepend(box);
      box.querySelectorAll('[data-e360]').forEach(b=>b.onclick=()=>window.openEmployee360?window.openEmployee360(b.dataset.e360):alert('Employee 360° загружается. Повторите через секунду.'));
      removeDuplicates();
    } finally { mounting=false; }
  }
  const observer=new MutationObserver(()=>{
    removeDuplicates();
    if(!document.getElementById('crn-attention-panel')) setTimeout(mount,120);
  });
  document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});setTimeout(mount,300)});
  window.addEventListener('crn:session',()=>setTimeout(mount,150));
  setTimeout(mount,800);
})();