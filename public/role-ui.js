(()=>{
  const norm=s=>String(s||'').trim().toLowerCase();
  let user=null, observer=null, running=false;

  async function loadUser(){
    try{const r=await fetch('/api/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;return (await r.json()).user||null}catch{return null}
  }
  function exactText(el,text){return norm(el?.textContent)===norm(text)}
  function isOwner(){return !!user && user.role==='moderator' && String(user.id)==='2011'}
  function removeNamedControls(names){
    const wanted=new Set(names.map(norm));
    document.querySelectorAll('.tab-btn,button,a,[role="button"]').forEach(el=>{
      if(wanted.has(norm(el.textContent))) el.remove();
    });
  }
  function removeOwnerOnlyUI(){
    if(isOwner()) return;
    removeNamedControls(['Доступы и штат','Управление сотрудниками и доступами']);
    document.querySelectorAll('#crn-mod-tools-btn,#crn-mod-tools').forEach(el=>el.remove());
  }
  function isRosterPage(){
    const t=norm(document.body?.innerText);
    return t.includes('добавить сотрудника вручную')||t.includes('массовая загрузка из excel');
  }
  function lockDirectorFields(){
    document.querySelectorAll('.roster-form input,.roster-form select').forEach(el=>{
      const n=norm(el.name||el.id||'');
      const label=norm(el.closest('.field')?.querySelector('label')?.textContent||'');
      if(n.includes('store')||label==='магазин'){el.value=user.store||'';el.disabled=true;}
      if(n.includes('city')||label==='город'){el.value=user.city||'';el.disabled=true;}
      if(n.includes('brand')||label==='бренд'){el.value=user.brand||'';el.disabled=true;}
    });
    document.querySelectorAll('.roster-form select').forEach(sel=>{
      const label=norm(sel.closest('.field')?.querySelector('label')?.textContent||'');
      if(label==='должность'){
        [...sel.options].forEach(o=>{if(['director','moderator','директор','модератор'].includes(norm(o.value)||norm(o.textContent)))o.remove()});
      }
    });
  }
  function stripDirectorRosterList(){
    if(!isRosterPage())return;
    document.querySelectorAll('table.team, table').forEach(t=>t.remove());
    document.querySelectorAll('.small-btn,button').forEach(b=>{if(exactText(b,'Удалить'))b.remove()});
    document.querySelectorAll('[data-employee-id],.employee-list,.roster-list').forEach(el=>el.remove());
    lockDirectorFields();
  }
  function escapeForbiddenPage(){
    const t=norm(document.body?.innerText);
    if(t.includes('ии-генерация новых блоков обучения')||t.includes('уже добавленные ии-блоки')||t.includes('резервная копия данных')){
      if(typeof window.setTab==='function'){try{window.setTab('team')}catch{}}
    }
  }
  function enforceDirector(){
    if(!user||user.role!=='director')return;
    removeNamedControls(['ИИ-блоки','Резервная копия']);
    escapeForbiddenPage();
    stripDirectorRosterList();
  }
  function enforceBasicUser(){
    if(!user||!['stylist','admin','online_manager'].includes(user.role))return;
    removeNamedControls(['Команда','Рейтинг','Сотрудники','ИИ-блоки','Резервная копия']);
  }
  function run(){
    if(running||!user)return;running=true;
    try{removeOwnerOnlyUI();enforceDirector();enforceBasicUser()}finally{running=false}
  }
  async function boot(){
    user=await loadUser();run();
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>requestAnimationFrame(run));
    observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
    setInterval(run,500);
  }
  window.addEventListener('crn:session',e=>{user=e.detail||null;run()});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,150));
  setTimeout(boot,350);
})();