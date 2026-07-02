import { renderWelcome, initWelcome } from './pages/welcome.js';
import { renderChat, initChat } from './pages/chat.js';
import { renderHub, initHub } from './pages/hub.js';
import { initAchievements } from './achievements.js';

const app = document.getElementById('app');

const routes = {
  '/': { render: renderWelcome, init: initWelcome, page: 'welcome' },
  '/chat': { render: renderChat, init: initChat, page: 'chat' },
  '/hub': { render: () => renderHub('playbooks'), init: () => initHub('playbooks'), page: 'hub' },
};

function parseRoute() {
  const hash = location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'hub' && parts[1]) {
    const section = parts[1];
    return { path: '/hub', section, page: 'hub' };
  }

  const path = '/' + (parts[0] || '');
  return { path: routes[path] ? path : '/', section: null, page: routes[path]?.page || 'welcome' };
}

function navigate() {
  const { path, section, page } = parseRoute();
  const route = routes[path] || routes['/'];

  if (path === '/hub' && section) {
    app.innerHTML = renderHub(section);
    initHub(section);
  } else {
    app.innerHTML = route.render();
    route.init();
  }

  updateNav(page);
  bindNavLinks();
}

function updateNav(activePage) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === activePage);
  });
}

function bindNavLinks() {
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelector('.header-inner')?.classList.remove('nav-open');
    });
  });
}

window.addEventListener('hashchange', navigate);

document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  document.querySelector('.header-inner')?.classList.toggle('nav-open');
});

initAchievements();
navigate();
