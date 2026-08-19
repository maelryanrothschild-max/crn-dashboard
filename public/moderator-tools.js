(() => {
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shown = (v) => {
    const s = String(v ?? '').trim();
    return !s || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null' ? '—' : s;
  };
  const roleLabel = r => ({moderator:'Модератор',director:'Директор',admin:'Администратор',stylist:'Стилист',online_manager:'Онлайн-менеджер'}[r] || shown(r));

  async function getMe(){ try { const r=await fetch('/api/me',{credentials:'same-origin'}); if(!r.ok)return null; return (await r.json()).user; } catch { return null; } }

  async function openTools(){
    const me = await getMe();
    if(!me || me.role !== 'moderator' || String(me.id) !== '2011') return alert('Доступ только владельцу-модератору');
    let data;
    try { const r=await fetch('/api/admin/credentials',{credentials:'same-origin'}); data=await r.json(); if(!r.ok) throw new Error(data.error||'Ошибка'); }
    catch(e){ return alert(e.message); }

    const old=document.getElementById('crn-mod-tools'); if(old) old.remove();
    const wrap=document.createElement('div'); wrap.id='crn-mod-tools';
    wrap.innerHTML=`<div style="position:fixed;inset:0;background:rgba(20,27,40,.62);z-index:99998"></div>
    <div style="position:fixed;z-index:99999;left:4%;right:4%;top:4%;bottom:4%;background:#fff;border-radius:8px;overflow:auto;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.3)">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;position:sticky;top:-24px;background:#fff;padding:14px 0;border-bottom:1px solid #ddd;z-index:2">
        <div><h2 style="margin:0;color:#1B2436">Управление сотрудниками и доступами</h2><div style="font-size:13px;color:#666;margin-top:4px">Только для владельца-модератора</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button id="crn-sync" style="padding:10px 14px;background:#A9812E;color:#fff;border:0;border-radius:4px;cursor:pointer">Синхронизировать штат из Excel</button><button id="crn-close" style="padding:10px 14px;background:#1B2436;color:#fff;border:0;border-radius:4px;cursor:pointer">Закрыть</button></div>
      </div>
      <div id="crn-sync-status" style="margin:14px 0;font-size:13px"></div>
      <input id="crn-cred-search" placeholder="Поиск сотрудника, магазина, роли" style="width:100%;max-width:420px;padding:10px 12px;margin-bottom:14px;border:1px solid #ccc;border-radius:4px">
      <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#1B2436;color:#fff"><th style="padding:9px;text-align:left">Сотрудник</th><th style="padding:9px;text-align:left">Роль</th><th style="padding:9px;text-align:left">Магазин</th><th style="padding:9px;text-align:left">Логин/ID</th><th style="padding:9px;text-align:left">Пароль/PIN</th></tr></thead><tbody id="crn-cred-body"></tbody></table></div>
    </div>`;
    document.body.appendChild(wrap);
    const creds=data.credentials||[];
    const render=(q='')=>{ const s=q.trim().toLowerCase(); document.getElementById('crn-cred-body').innerHTML=creds.filter(e=>!s||`${e.surname} ${e.firstname} ${e.store} ${roleLabel(e.role)} ${e.id}`.toLowerCase().includes(s)).map(e=>`<tr style="border-bottom:1px solid #eee"><td style="padding:9px">${esc(shown(e.surname))} ${esc(shown(e.firstname))}</td><td style="padding:9px">${esc(roleLabel(e.role))}</td><td style="padding:9px">${esc(shown(e.store))}</td><td style="padding:9px;font-weight:700">${esc(shown(e.login))}</td><td style="padding:9px;font-weight:700">${esc(shown(e.pin))}</td></tr>`).join(''); };
    render();
    document.getElementById('crn-cred-search').oninput=e=>render(e.target.value);
    document.getElementById('crn-close').onclick=()=>wrap.remove();
    document.getElementById('crn-sync').onclick=async()=>{
      if(!confirm('Синхронизировать штат по утверждённому Excel? Перед изменением будет создана резервная копия, роли и магазины будут исправлены, дубли объединены с переносом прогресса.')) return;
      const box=document.getElementById('crn-sync-status'); box.textContent='Синхронизация…';
      try{ const r=await fetch('/api/admin/sync-roster',{method:'POST',credentials:'same-origin'}); const j=await r.json(); if(!r.ok) throw new Error(j.error||'Ошибка'); box.innerHTML=`<b>Готово.</b> Сотрудников: ${j.employees}; директоров: ${j.directors}; объединено дублей: ${j.mergedDuplicateAccounts}; перенесено прогрессов: ${j.migratedProgressAccounts}; сохранено PIN: ${j.preservedPins}. Перезагрузите страницу.`; }
      catch(e){ box.textContent='Ошибка: '+e.message; }
    };
  }

  async function mount(){
    const me=await getMe();
    let b=document.getElementById('crn-mod-tools-btn');
    if(!me || me.role!=='moderator' || String(me.id)!=='2011'){ if(b)b.remove(); return; }
    if(b)return;
    b=document.createElement('button'); b.id='crn-mod-tools-btn'; b.textContent='Доступы и штат';
    b.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99990;background:#A9812E;color:#fff;border:0;border-radius:5px;padding:11px 15px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.2)';
    b.onclick=openTools; document.body.appendChild(b);
  }
  setInterval(mount,1800); setTimeout(mount,900);
})();
