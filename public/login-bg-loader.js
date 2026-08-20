(()=>{
  let dataUrl=null;
  let loading=null;

  async function loadFinalBackground(){
    if(dataUrl) return dataUrl;
    if(!loading){
      loading=Promise.all([1,2,3,4,5,6].map(i=>fetch(`/crn-bg-parts/part${i}.txt`,{cache:'force-cache'}).then(r=>{
        if(!r.ok) throw new Error(`CRN background part ${i} unavailable`);
        return r.text();
      }))).then(parts=>{
        dataUrl=`url("data:image/webp;base64,${parts.join('')}")`;
        return dataUrl;
      });
    }
    return loading;
  }

  function tuneForViewport(wrap){
    if(!wrap) return;
    if(window.matchMedia('(max-width: 640px)').matches){
      wrap.style.setProperty('background-position','center top','important');
      wrap.style.setProperty('background-size','100% auto','important');
    }else{
      wrap.style.setProperty('background-position','center center','important');
      wrap.style.setProperty('background-size','contain','important');
    }
  }

  async function applyFinalBackground(){
    const wrap=document.querySelector('.login-wrap');
    if(!wrap) return;
    try{
      const url=await loadFinalBackground();
      wrap.style.setProperty('background-color','#06152d','important');
      wrap.style.setProperty('background-image',url,'important');
      wrap.style.setProperty('background-repeat','no-repeat','important');
      tuneForViewport(wrap);
      wrap.dataset.crnFinalBg='1';
    }catch(e){
      console.warn('CRN final login background fallback active',e);
    }
  }

  function sync(){ applyFinalBackground(); }

  document.addEventListener('DOMContentLoaded',()=>{
    sync();
    new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  });
  window.addEventListener('resize',()=>tuneForViewport(document.querySelector('.login-wrap')),{passive:true});
  setTimeout(sync,300);
})();
