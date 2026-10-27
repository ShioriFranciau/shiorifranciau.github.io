(() => {
  'use strict';

  const root = document.querySelector('[data-message-admin]');
  if (!root) return;

  const login = root.querySelector('[data-admin-login]');
  const inbox = root.querySelector('[data-admin-inbox]');
  const list = root.querySelector('[data-admin-list]');
  const summary = root.querySelector('[data-admin-summary]');
  const status = root.querySelector('[data-admin-status]');
  let adminToken = sessionStorage.getItem('shiori-admin-token') || '';

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char]);

  const formatTime = (value) => new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));

  const request = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${adminToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return data;
  };

  const render = (messages) => {
    summary.textContent = `共 ${messages.length} 条留言`;
    list.innerHTML = messages.length ? messages.map((message) => `
      <article class="admin-message" data-id="${escapeHtml(message.id)}">
        <header>
          <div><strong>${escapeHtml(message.name || '未署名')}</strong><time>${escapeHtml(formatTime(message.createdAt))}</time></div>
          <button class="message-status-pill" type="button" data-mark-read data-status="${escapeHtml(message.status)}">${message.status === 'read' ? '已读' : '未读'}</button>
        </header>
        <p>${escapeHtml(message.body)}</p>
        ${message.contact ? `<footer>联系方式：${escapeHtml(message.contact)}</footer>` : ''}
      </article>`).join('') : '<p class="empty-inbox">还没有收到留言。</p>';
  };

  const loadMessages = async () => {
    status.textContent = '正在读取…';
    try {
      const data = await request('/api/admin/messages');
      render(data.messages);
      login.hidden = true;
      inbox.hidden = false;
      status.textContent = '';
    } catch (error) {
      sessionStorage.removeItem('shiori-admin-token');
      adminToken = '';
      login.hidden = false;
      inbox.hidden = true;
      status.textContent = error.message;
      status.dataset.type = 'error';
    }
  };

  login.addEventListener('submit', (event) => {
    event.preventDefault();
    adminToken = String(new FormData(login).get('token') || '');
    sessionStorage.setItem('shiori-admin-token', adminToken);
    loadMessages();
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-mark-read]');
    if (!button) return;
    const article = button.closest('[data-id]');
    const nextStatus = button.dataset.status === 'read' ? 'unread' : 'read';
    try {
      await request(`/api/admin/messages/${encodeURIComponent(article.dataset.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      button.dataset.status = nextStatus;
      button.textContent = nextStatus === 'read' ? '已读' : '未读';
    } catch (error) {
      summary.textContent = error.message;
    }
  });

  root.querySelector('[data-admin-lock]').addEventListener('click', () => {
    sessionStorage.removeItem('shiori-admin-token');
    adminToken = '';
    location.reload();
  });

  if (adminToken) loadMessages();
})();
