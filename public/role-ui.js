(()=>{
  const norm=s=>String(s||'').trim().toLowerCase();
  let user=null;

  async function loadUser(){
    try{const r=await fetch('/api/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;return (await r.json()).user||null}catch{return null}
  }

  function removeTabByText(text){
    document.querySelectorAll('.tab-btn').forEach(el=>{if(norm(el.textContent)===norm(text))el.remove();});
  }

  function lockDirectorRoster(){
    if(!user||user.role!=='director')return;
    const bodyText=norm(document.body?.innerText);
    if(!bodyText.includes('добавить сотрудника вручную') && !bodyText.includes('массовая загрузка из excel')) return;

    document.querySelectorAll('table.team').forEach(t=>t.remove());
    document.querySelectorAll('button,.small-btn').forEach(b=>{if(norm(b.textContent)==='удалить')b.remove();});

    document.querySelectorAll('.roster-form input,.roster-form select').forEach(el=>{
      const n=norm(el.name||el.id||'');
      const label=norm(el.closest('.field')?.querySelector('label')?.textContent||'');
      if(n.includes('store')||label==='магазин'){el.value=user.store||'';el.disabled=true;}
      if(n.includes('city')||label==='город'){el.value=user.city||'';el.disabled=true;}
      if(n.includes('brand')||label==='бренд'){el.value=user.brand||'';el.disabled=true;}
    });
  }

  function enforceDirector(){
    if(!user||user.role!=='director')return;
    removeTabByText('ИИ-блоки');
    removeTabByText('Резервная копия');

    const txt=norm(document.body?.innerText);
    if(txt.includes('ии-генерация новых блоков обучения')||txt.includes('резервная копия данных')){
      if(typeof window.setTab==='function') window.setTab('team');
    }

    lockDirectorRoster();
  }

  function enforceBasicUser(){
    if(!user||!['stylist','admin','online_manager'].includes(user.role))return;
    ['Команда','Рейтинг','Сотрудники','ИИ-блоки','Резервная копия'].forEach(removeTabByText);
  }

  function run(){
    if(!user)return;
    enforceDirector();
    enforceBasicUser();
  }

  async function boot(){user=await loadUser();run();const mo=new MutationObserver(run);mo.observe(document.documentElement,{childList:true,subtree:true});setInterval(run,1200)}
  window.addEventListener('crn:session',e=>{user=e.detail||null;run()});
  setTimeout(boot,500);
})();
