(()=>{
  function tuneForViewport(wrap){
    if(!wrap) return;
    wrap.style.setProperty('background-color','#06152d','important');
    wrap.style.setProperty('background-image','url("/crn-login-bg.webp?v=final11")','important');
    wrap.style.setProperty('background-repeat','no-repeat','important');
    if(window.matchMedia('(max-width: 640px)').matches){
      wrap.style.setProperty('background-position','center top','important');
      wrap.style.setProperty('background-size','100% auto','important');
    }else{
      wrap.style.setProperty('background-position','center center','important');
      wrap.style.setProperty('background-size','contain','important');
    }
    wrap.dataset.crnFinalBg='1';
  }

  function sync(){
    const wrap=document.querySelector('.login-wrap');
    if(!wrap) return;
    document.querySelectorAll('.crn-login-brand').forEach(el=>el.remove());
    tuneForViewport(wrap);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync);
  else sync();
  new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',()=>tuneForViewport(document.querySelector('.login-wrap')),{passive:true});
  setTimeout(sync,100);
  setTimeout(sync,500);
})();
