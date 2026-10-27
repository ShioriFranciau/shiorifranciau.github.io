(() => {
  'use strict';

  const page = document.querySelector('[data-message-page]');
  if (!page) return;

  const form = page.querySelector('[data-message-form]');
  const textarea = form.querySelector('textarea[name="message"]');
  const count = form.querySelector('[data-message-count]');
  const submit = form.querySelector('[data-message-submit]');
  const status = form.querySelector('[data-message-status]');
  const receipt = page.querySelector('[data-message-receipt]');
  const privateView = page.querySelector('[data-private-message]');

  const setStatus = (text, type = '') => {
    status.textContent = text;
    status.dataset.type = type;
  };

  const updateCount = () => {
    count.textContent = `${textarea.value.length} / 4000`;
  };

  const readToken = () => {
    const match = location.hash.match(/(?:^#|&)token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  const formatTime = (value) => new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));

  const showPrivateMessage = async (id, token) => {
    form.hidden = true;
    setStatus('正在读取留言…');
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '无法读取这条留言');

      privateView.querySelector('[data-private-name]').textContent = data.message.name || '未署名';
      privateView.querySelector('[data-private-time]').textContent = formatTime(data.message.createdAt);
      privateView.querySelector('[data-private-body]').textContent = data.message.body;
      const statusPill = privateView.querySelector('[data-private-status]');
      statusPill.textContent = data.message.status === 'read' ? '已读' : '已送达';
      statusPill.dataset.status = data.message.status;
      privateView.hidden = false;
    } catch (error) {
      form.hidden = false;
      setStatus(error.message, 'error');
    }
  };

  textarea.addEventListener('input', updateCount);
  updateCount();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const body = String(values.get('message') || '').trim();
    if (!body) {
      setStatus('请先写下留言内容。', 'error');
      textarea.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = '正在提交…';
    setStatus('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(values.get('name') || '').trim(),
          contact: String(values.get('contact') || '').trim(),
          message: body,
          website: String(values.get('website') || ''),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '提交失败，请稍后再试');

      const privateUrl = new URL('/message/', location.origin);
      privateUrl.searchParams.set('id', data.id);
      privateUrl.hash = `token=${encodeURIComponent(data.token)}`;
      receipt.querySelector('[data-private-link]').value = privateUrl.href;
      form.hidden = true;
      receipt.hidden = false;
      history.replaceState(null, '', '/message/');
      receipt.focus?.();
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = '私密提交';
    }
  });

  receipt.querySelector('[data-copy-link]').addEventListener('click', async (event) => {
    const link = receipt.querySelector('[data-private-link]').value;
    await navigator.clipboard.writeText(link);
    event.currentTarget.textContent = '已复制';
  });

  const id = new URLSearchParams(location.search).get('id');
  const token = readToken();
  if (id && token) showPrivateMessage(id, token);
})();
