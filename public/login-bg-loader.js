(()=>{
  let finalUrl=null;
  let loading=null;

  async function loadFinalBackground(){
    if(finalUrl) return finalUrl;
    if(!loading){
      loading=Promise.all([1,2,3,4,5,6].map(i=>
        fetch(`/crn-bg-parts/part${i}.txt`,{cache:'force-cache'}).then(r=>{
          if(!r.ok) throw new Error(`CRN background part ${i} unavailable`);
          return r.text();
        })
      )).then(parts=>{
        const base64=parts.map(p=>p.trim()).join('');
        finalUrl=`url("data:image/webp;base64,${base64}")`;
        return finalUrl;
      });
    }
    return loading;
  }

  function tuneForViewport(){
    const wrap=document.querySelector('.login-wrap');
    if(!wrap) return;
    if(window.matchMedia('(max-width: 640px)').matches){
      wrap.style.setProperty('background-position','center top','important');
      wrap.style.setProperty('background-size','100% auto','important');
    }else if(window.matchMedia('(max-width: 900px)').matches){
      wrap.style.setProperty('background-position','center center','important');
      wrap.style.setProperty('background-size','cover','important');
    }else{
      wrap.style.setProperty('background-position','center center','important');
      wrap.style.setProperty('background-size','cover','important');
    }
  }

  async function applyFinalBackground(){
    const wrap=document.querySelector('.login-wrap');
    if(!wrap || wrap.dataset.crnFinalBg==='1') return;
    try{
      const url=await loadFinalBackground();
      wrap.style.setProperty('background-color','#06152d','important');
      wrap.style.setProperty('background-image',url,'important');
      wrap.style.setProperty('background-repeat','no-repeat','important');
      tuneForViewport();
      wrap.dataset.crnFinalBg='1';
    }catch(e){
      console.warn('CRN final login background fallback active',e);
    }
  }

  function sync(){
    applyFinalBackground();
    tuneForViewport();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    sync();
    new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  });
  window.addEventListener('resize',tuneForViewport,{passive:true});
  setTimeout(sync,300);
})();
