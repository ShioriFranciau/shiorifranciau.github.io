(() => {
  'use strict';

  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('[data-theme-toggle]');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem('shiori-theme', theme);
    if (themeColor) themeColor.content = theme === 'dark' ? '#111210' : '#fafaf8';
    themeButtons.forEach((button) => {
      const next = theme === 'dark' ? '浅色' : '深色';
      button.setAttribute('aria-label', `切换到${next}模式`);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  };

  applyTheme(root.dataset.theme || 'light');
  themeButtons.forEach((button) => {
    button.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  });

  const sidebar = document.querySelector('[data-sidebar]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const scrim = document.querySelector('[data-nav-scrim]');

  const setMenu = (open) => {
    if (!sidebar || !menuButton || !scrim) return;
    sidebar.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    scrim.hidden = !open;
    if (open) sidebar.querySelector('a, button')?.focus();
  };

  menuButton?.addEventListener('click', () => setMenu(!sidebar?.classList.contains('is-open')));
  scrim?.addEventListener('click', () => setMenu(false));
  sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      const searchLink = document.querySelector('.search-link');
      if (searchLink) {
        event.preventDefault();
        window.location.href = searchLink.href;
      }
    }
  });

  const backToTop = document.querySelector('[data-back-to-top]');
  const progress = document.querySelector('[data-reading-progress]');
  let ticking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    backToTop?.classList.toggle('is-visible', scrollTop > 500);
    if (progress) {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = distance > 0 ? Math.min(1, scrollTop / distance) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollUI);
      ticking = true;
    }
  }, { passive: true });

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  updateScrollUI();
})();
