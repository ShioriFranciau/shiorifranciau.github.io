(() => {
  'use strict';

  const panel = document.querySelector('[data-search]');
  if (!panel) return;

  const input = panel.querySelector('[data-search-input]');
  const status = panel.querySelector('[data-search-status]');
  const results = panel.querySelector('[data-search-results]');
  let index = [];

  const normalise = (value) => String(value || '').toLocaleLowerCase('zh-CN');

  const render = (items, query) => {
    results.replaceChildren();
    if (!query) {
      status.textContent = '输入关键词开始搜索。';
      return;
    }

    status.textContent = items.length ? `找到 ${items.length} 篇相关内容。` : '没有找到相关内容。';
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const link = document.createElement('a');
      const title = document.createElement('h2');
      const summary = document.createElement('p');
      const meta = document.createElement('div');
      const date = document.createElement('span');
      const category = document.createElement('span');

      link.className = 'search-result';
      link.href = item.url;
      title.textContent = item.title;
      summary.textContent = item.summary || '暂无摘要';
      meta.className = 'search-result-meta';
      date.textContent = item.date;
      category.textContent = item.category;
      meta.append(date, category);
      link.append(title, summary, meta);
      fragment.append(link);
    });

    results.append(fragment);
  };

  const search = () => {
    const query = normalise(input.value.trim());
    if (!query) return render([], '');
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = index.filter((item) => {
      const haystack = normalise([item.title, item.summary, item.content, item.category].join(' '));
      return terms.every((term) => haystack.includes(term));
    }).slice(0, 20);
    render(matches, query);
  };

  fetch(panel.dataset.indexUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      index = Array.isArray(data) ? data : [];
      status.textContent = '输入关键词开始搜索。';
      search();
    })
    .catch(() => {
      status.textContent = '搜索索引暂时不可用，请稍后重试。';
      input.disabled = true;
    });

  input.addEventListener('input', search);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      search();
      input.blur();
    }
  });
})();
