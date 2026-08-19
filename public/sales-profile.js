(() => {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function me(){try{const r=await fetch('/api/me',{credentials:'same-origin'});if(!r.ok)return null;return (await r.json()).user;}catch{return null;}}
  function resultHtml(result){
    if(!result)return '<div style="color:#666">Профиль ещё не заполнен.</div>';
    const rows=Object.entries(result.scores||{}).map(([k,v])=>`<div style="display:grid;grid-template-columns:1fr 70px;gap:12px;padding:7px 0;border-bottom:1px solid #eee"><span>${esc((window.__crnDimensions||{})[k]?.title||k)}</span><b>${esc(v)}%</b></div>`).join('');
    return `<div style="margin-bottom:14px">${rows}</div><div style="padding:14px;background:#F7F4EE;border-left:4px solid #A9812E;line-height:1.45"><b>Сильные стороны:</b> ${esc(result.summary?.strengthsText||'—')}<br><br><b>Зоны развития:</b> ${esc(result.summary?.developmentText||'—')}<br><br><b>Фокус:</b> ${esc(result.summary?.focus||'—')}</div>`;
  }
  async function openProfile(){
    const user=await me(); if(!user)return;
    const r=await fetch('/api/sales-profile',{credentials:'same-origin'}); const j=await r.json(); if(!r.ok)return alert(j.error||'Ошибка');
    window.__crnDimensions=j.dimensions||{};
    const old=document.getElementById('crn-sales-profile-modal');if(old)old.remove();
    const wrap=document.createElement('div');wrap.id='crn-sales-profile-modal';
    const done=!!j.result;
    wrap.innerHTML=`<div style="position:fixed;inset:0;background:rgba(20,27,40,.64);z-index:99960"></div><div style="position:fixed;z-index:99961;left:5%;right:5%;top:4%;bottom:4%;background:#fff;border-radius:8px;overflow:auto;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.3)"><div style="display:flex;justify-content:space-between;gap:16px;align-items:center;position:sticky;top:-24px;background:#fff;padding:14px 0;border-bottom:1px solid #ddd;z-index:2"><div><h2 style="margin:0;color:#1B2436">CRN Sales Profile</h2><div style="font-size:13px;color:#666;margin-top:4px">Рабочий профиль продавца: эмоции, сервис, уверенность, инициатива и обучаемость</div></div><button id="crn-sp-close" style="padding:10px 14px;background:#1B2436;color:#fff;border:0;border-radius:4px;cursor:pointer">Закрыть</button></div><div style="margin:14px 0;padding:10px 12px;background:#FFF8E8;border:1px solid #E6D6AA;border-radius:4px;font-size:13px">${esc(j.notice||'')}</div><div id="crn-sp-result">${resultHtml(j.result)}</div>${done?'<button id="crn-sp-retake" style="margin-top:16px;padding:10px 14px;background:#A9812E;color:#fff;border:0;border-radius:4px;cursor:pointer">Пройти заново</button>':'<button id="crn-sp-start" style="margin-top:16px;padding:10px 14px;background:#A9812E;color:#fff;border:0;border-radius:4px;cursor:pointer">Начать диагностику</button>'}<div id="crn-sp-form" style="display:none;margin-top:18px"></div></div>`;
    document.body.appendChild(wrap);document.getElementById('crn-sp-close').onclick=()=>wrap.remove();
    const start=()=>{
      const form=document.getElementById('crn-sp-form');form.style.display='block';
      form.innerHTML=(j.items||[]).map((it,idx)=>`<div style="padding:14px 0;border-bottom:1px solid #eee"><div style="font-weight:700;margin-bottom:8px">${idx+1}. ${esc(it.text)}</div><div style="display:flex;gap:8px;flex-wrap:wrap">${[1,2,3,4,5].map(v=>`<label style="border:1px solid #ddd;border-radius:4px;padding:7px 9px;cursor:pointer"><input type="radio" name="${esc(it.id)}" value="${v}"> ${v}</label>`).join('')}</div><div style="font-size:11px;color:#777;margin-top:5px">1 — совсем не похоже на меня · 5 — очень похоже на меня</div></div>`).join('')+'<button id="crn-sp-submit" style="margin-top:18px;padding:12px 18px;background:#1B2436;color:#fff;border:0;border-radius:4px;font-weight:700;cursor:pointer">Сохранить профиль</button><div id="crn-sp-status" style="margin-top:10px;font-size:13px"></div>';
      document.getElementById('crn-sp-submit').onclick=async()=>{
        const responses={};(j.items||[]).forEach(it=>{const x=form.querySelector(`input[name="${it.id}"]:checked`);if(x)responses[it.id]=Number(x.value);});
        const box=document.getElementById('crn-sp-status');box.textContent='Сохраняю…';
        const rr=await fetch('/api/sales-profile',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({responses})});const jj=await rr.json();if(!rr.ok){box.textContent='Ошибка: '+(jj.error||'');return;}j.result=jj.result;document.getElementById('crn-sp-result').innerHTML=resultHtml(jj.result);form.style.display='none';box.textContent='';
      };
    };
    const sb=document.getElementById(done?'crn-sp-retake':'crn-sp-start');if(sb)sb.onclick=start;
  }
  async function mount(){const user=await me();let b=document.getElementById('crn-sales-profile-btn');if(!user){if(b)b.remove();return;}if(b)return;b=document.createElement('button');b.id='crn-sales-profile-btn';b.textContent='Sales Profile';b.style.cssText='position:fixed;left:118px;bottom:18px;z-index:99950;background:#A9812E;color:#fff;border:0;border-radius:5px;padding:11px 15px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.2)';b.onclick=openProfile;document.body.appendChild(b);}
  setInterval(mount,2200);setTimeout(mount,1200);
})();
