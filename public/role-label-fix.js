(()=>{
  let done=false;
  function apply(){
    try{
      if(typeof ROLE_LABEL==='undefined') return false;
      ROLE_LABEL.online_manager='Онлайн-менеджер';
      done=true;
      if(typeof render==='function') setTimeout(()=>{try{render()}catch{}},0);
      return true;
    }catch{return false;}
  }
  if(!apply()){
    const timer=setInterval(()=>{
      if(apply()) clearInterval(timer);
    },50);
    setTimeout(()=>clearInterval(timer),5000);
  }
})();
