(()=>{
  function applyFinalBackground(){
    const wrap=document.querySelector('.login-wrap');
    if(!wrap) return;
    wrap.style.setProperty('background-color','#06152d','important');
    wrap.style.setProperty('background-image','url("/crn-login-bg.webp")','important');
    wrap.style.setProperty('background-repeat','no-repeat','important');
    tuneForViewport();
    wrap.dataset.crnFinalBg='1';
  }

  function tuneForViewport(){
    const wrap=document.querySelector('.login-wrap');
    if(!wrap) return;
    if(window.matchMedia('(max-width: 640px)').matches){
      wrap.style.setProperty('background-position','center top','important');
      wrap.style.setProperty('background-size','100% auto','important');
    }else{
      wrap.style.setProperty('background-position','center center','important');
      wrap.style.setProperty('background-size','cover','important');
    }
  }

  function sync(){
    applyFinalBackground();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    sync();
    new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  });
  window.addEventListener('resize',tuneForViewport,{passive:true});
  setTimeout(sync,300);
})();
