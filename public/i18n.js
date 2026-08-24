(function(){
  const KEY='crn_language';
  const dict={
    ru:{login:'Войти',surname:'Фамилия',password:'Пароль',logout:'Выйти',training:'Обучение',progress:'Прогресс',employees:'Сотрудники',rating:'Рейтинг',development:'Моё развитие',language:'Язык'},
    kk:{login:'Кіру',surname:'Тегі',password:'Құпиясөз',logout:'Шығу',training:'Оқу',progress:'Прогресс',employees:'Қызметкерлер',rating:'Рейтинг',development:'Менің дамуым',language:'Тіл'}
  };
  function get(){return localStorage.getItem(KEY)||'ru'}
  function set(lang){if(lang!=='ru'&&lang!=='kk')return;localStorage.setItem(KEY,lang);document.documentElement.lang=lang==='kk'?'kk':'ru';apply();window.dispatchEvent(new CustomEvent('crn-language-change',{detail:{language:lang}}));}
  function replaceExact(root,from,to){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement&&['SCRIPT','STYLE'].includes(n.parentElement.tagName))continue;if(n.nodeValue.trim()===from)n.nodeValue=n.nodeValue.replace(from,to);}}
  function apply(){const lang=get();document.documentElement.lang=lang==='kk'?'kk':'ru';if(lang==='kk'){Object.keys(dict.ru).forEach(k=>replaceExact(document.body,dict.ru[k],dict.kk[k]));}else{Object.keys(dict.kk).forEach(k=>replaceExact(document.body,dict.kk[k],dict.ru[k]));}document.querySelectorAll('[data-crn-lang]').forEach(b=>b.classList.toggle('active',b.dataset.crnLang===lang));}
  function mount(){if(document.getElementById('crn-language-switcher')){apply();return;}const box=document.createElement('div');box.id='crn-language-switcher';box.innerHTML='<button type="button" data-crn-lang="kk">ҚАЗ</button><span></span><button type="button" data-crn-lang="ru">РУС</button>';box.addEventListener('click',e=>{const b=e.target.closest('[data-crn-lang]');if(b)set(b.dataset.crnLang)});document.body.appendChild(box);apply();}
  const css=document.createElement('style');css.textContent='#crn-language-switcher{position:fixed;right:18px;top:16px;z-index:99999;display:flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(255,255,255,.32);border-radius:999px;background:rgba(27,36,54,.88);backdrop-filter:blur(8px);box-shadow:0 5px 18px rgba(0,0,0,.16)}#crn-language-switcher button{border:0;background:transparent;color:rgba(255,255,255,.6);font:700 11px/1 Arial,sans-serif;letter-spacing:.8px;cursor:pointer;padding:4px 3px}#crn-language-switcher button.active{color:#fff}#crn-language-switcher span{width:1px;height:13px;background:rgba(255,255,255,.28)}@media(max-width:640px){#crn-language-switcher{right:10px;top:9px;padding:6px 8px}}';document.head.appendChild(css);
  window.CRNI18N={getLanguage:get,setLanguage:set,t:(key)=>dict[get()][key]||key};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true});
})();