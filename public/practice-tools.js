(() => {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function getMe(){ try{ const r=await fetch('/api/me',{credentials:'same-origin'}); if(!r.ok)return null; return (await r.json()).user; }catch{return null;} }

  async function openPractice(){
    const me=await getMe(); if(!me) return;
    const r=await fetch('/api/practice',{credentials:'same-origin'}); const j=await r.json();
    if(!r.ok) return alert(j.error||'Не удалось загрузить практику');
    const state=j.practice||{};
    const old=document.getElementById('crn-practice-modal'); if(old)old.remove();
    const wrap=document.createElement('div'); wrap.id='crn-practice-modal';
    wrap.innerHTML=`<div style="position:fixed;inset:0;background:rgba(20,27,40,.64);z-index:99980"></div>
    <div style="position:fixed;z-index:99981;left:5%;right:5%;top:5%;bottom:5%;background:#fff;border-radius:8px;overflow:auto;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.3)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;position:sticky;top:-24px;background:#fff;padding:14px 0;border-bottom:1px solid #ddd;z-index:2">
        <div><h2 style="margin:0;color:#1B2436">Практика в магазине</h2><div style="font-size:13px;color:#666;margin-top:4px">${esc(me.firstname||'')} ${esc(me.surname||'')} · отмечай только реально выполненные задания.</div></div>
        <button id="crn-practice-close" style="padding:10px 14px;background:#1B2436;color:#fff;border:0;border-radius:4px;cursor:pointer">Закрыть</button>
      </div>
      <div id="crn-practice-status" style="margin:14px 0;font-size:13px"></div>
      <div id="crn-practice-list"></div>
      <button id="crn-practice-save" style="margin-top:18px;padding:12px 18px;background:#A9812E;color:#fff;border:0;border-radius:4px;font-weight:700;cursor:pointer">Сохранить выполнение</button>
    </div>`;
    document.body.appendChild(wrap);
    const list=document.getElementById('crn-practice-list');
    list.innerHTML=(j.modules||[]).map(m=>{
      const saved=state[m.key]?.done||[];
      const done=saved.filter(Boolean).length;
      return `<section data-key="${esc(m.key)}" style="border:1px solid #ddd;border-radius:6px;padding:16px 18px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h3 style="margin:0;color:#1B2436">${esc(m.title)}</h3><span style="font-size:12px;color:#666">${done}/${m.tasks.length}</span></div>
        <div style="margin-top:12px">${m.tasks.map((t,i)=>`<label style="display:flex;gap:9px;align-items:flex-start;margin:9px 0;line-height:1.35"><input type="checkbox" data-index="${i}" ${saved[i]?'checked':''} style="margin-top:3px"><span>${esc(t)}</span></label>`).join('')}</div>
      </section>`;
    }).join('');
    document.getElementById('crn-practice-close').onclick=()=>wrap.remove();
    document.getElementById('crn-practice-save').onclick=async()=>{
      const practice={};
      list.querySelectorAll('section[data-key]').forEach(sec=>{
        practice[sec.dataset.key]={done:[...sec.querySelectorAll('input[type=checkbox]')].map(x=>x.checked)};
      });
      const box=document.getElementById('crn-practice-status'); box.textContent='Сохраняю…';
      try{ const rr=await fetch('/api/practice',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({practice})}); const jj=await rr.json(); if(!rr.ok) throw new Error(jj.error||'Ошибка'); box.textContent='Готово. Практика сохранена.'; }
      catch(e){ box.textContent='Ошибка: '+e.message; }
    };
  }
  window.openCRNPractice=openPractice;
})();