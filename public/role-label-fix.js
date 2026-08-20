(()=>{
  const LABELS={
    stylist:'Стилист',
    admin:'Администратор',
    online_manager:'Онлайн-менеджер',
    director:'Директор',
    moderator:'Модератор'
  };
  let rendered=false;

  function patchGlobals(){
    try{
      if(typeof ROLE_LABEL!=='undefined'){
        Object.assign(ROLE_LABEL,LABELS);
      }
      if(typeof ROLE_RU_TO_KEY!=='undefined'){
        Object.assign(ROLE_RU_TO_KEY,{
          'стилист':'stylist',
          'стилист-консультант':'stylist',
          'администратор':'admin',
          'админ':'admin',
          'онлайн-менеджер':'online_manager',
          'онлайн менеджер':'online_manager',
          'online manager':'online_manager',
          'директор':'director',
          'директор магазина':'director',
          'модератор':'moderator'
        });
      }
      return typeof ROLE_LABEL!=='undefined';
    }catch{return false;}
  }

  function patchRoleSelects(){
    document.querySelectorAll('select#newRole').forEach(sel=>{
      const values=[...sel.options].map(o=>o.value);
      if(!values.includes('online_manager')){
        const opt=document.createElement('option');
        opt.value='online_manager';
        opt.textContent='Онлайн-менеджер';
        const director=[...sel.options].find(o=>o.value==='director');
        sel.insertBefore(opt,director||null);
      }
    });
  }

  function patchVisibleUndefined(){
    document.querySelectorAll('td,.role-badge').forEach(el=>{
      if(String(el.textContent||'').trim()==='undefined') el.textContent='—';
    });
  }

  function apply(){
    const ok=patchGlobals();
    patchRoleSelects();
    patchVisibleUndefined();
    if(ok&&!rendered&&typeof render==='function'){
      rendered=true;
      setTimeout(()=>{try{render()}catch{}},0);
    }
    return ok;
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
  const timer=setInterval(()=>{if(apply()) clearInterval(timer)},50);
  setTimeout(()=>clearInterval(timer),5000);
  new MutationObserver(()=>{patchGlobals();patchRoleSelects();patchVisibleUndefined()})
    .observe(document.documentElement,{childList:true,subtree:true});
})();
