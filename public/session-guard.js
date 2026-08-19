(function () {
  const nativeFetch = window.fetch.bind(window);
  const nativeOpen = window.open.bind(window);

  async function parseJsonSafe(response) {
    try { return await response.clone().json(); } catch { return null; }
  }

  async function sessionMe() {
    const response = await nativeFetch('/api/me', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.user ? data.user : null;
  }

  async function sessionLogout() {
    try {
      await nativeFetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      window.location.reload();
    }
  }

  function isOwnerModerator() {
    const u = window.CRNSession && window.CRNSession.user;
    return !!u && u.role === 'moderator' && String(u.id) === '2011';
  }

  function isExternal(raw) {
    if (!raw || raw === '#' || raw.startsWith('javascript:')) return false;
    try {
      const u = new URL(raw, window.location.href);
      return u.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  function denyExternal() {
    alert('В рабочем кабинете внешние переходы отключены.');
  }

  window.CRNSession = {
    user: null,
    async refresh() {
      this.user = await sessionMe();
      window.dispatchEvent(new CustomEvent('crn:session', { detail: this.user }));
      return this.user;
    },
    logout: sessionLogout,
    isModerator() { return !!this.user && this.user.role === 'moderator'; },
    isDirector() { return !!this.user && this.user.role === 'director'; },
    isOwnerModerator,
    canSeeTeam() { return this.isModerator() || this.isDirector(); }
  };

  window.fetch = async function (input, init) {
    const response = await nativeFetch(input, { ...(init || {}), credentials: 'same-origin' });
    const url = typeof input === 'string' ? input : (input && input.url) || '';

    if (url.startsWith('/api/') && !url.startsWith('/api/login') && response.status === 401) {
      window.CRNSession.user = null;
      window.dispatchEvent(new CustomEvent('crn:unauthorized'));
    }

    if (url.startsWith('/api/') && response.status === 403) {
      const body = await parseJsonSafe(response);
      window.dispatchEvent(new CustomEvent('crn:forbidden', { detail: body || { error: 'Недостаточно прав' } }));
    }

    if (url.startsWith('/api/login') && response.ok) {
      setTimeout(() => window.CRNSession.refresh(), 0);
    }

    if (url.startsWith('/api/logout') && response.ok) {
      window.CRNSession.user = null;
    }

    return response;
  };

  window.open = function (url, target, features) {
    if (!isOwnerModerator() && isExternal(String(url || ''))) {
      denyExternal();
      return null;
    }
    return nativeOpen(url, target, features);
  };

  document.addEventListener('click', function (event) {
    if (isOwnerModerator()) return;
    const a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a) return;
    if (isExternal(a.getAttribute('href'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      denyExternal();
    }
  }, true);

  document.addEventListener('submit', function (event) {
    if (isOwnerModerator()) return;
    const form = event.target;
    if (!form || !form.action) return;
    if (isExternal(form.action)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      denyExternal();
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    window.CRNSession.refresh().catch(function () {});
  });
})();
