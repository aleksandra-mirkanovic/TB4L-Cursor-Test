import { achievementsList } from './data/demo-data.js';
import {
  unlockAchievement,
  isAchievementUnlocked,
  getUnlockedAchievements,
  getState,
  markFirstVisitDone,
  isFirstVisit,
  markSectionVisited,
  incrementChatCount,
  getKnowledgeFiles,
} from './state.js';

let toastTimeout;

export function checkAchievements(trigger) {
  const unlocked = [];

  if (trigger === 'visit' && isFirstVisit()) {
    if (unlockAchievement('first-visit')) unlocked.push('first-visit');
    markFirstVisitDone();
  }

  if (trigger === 'hub-section') {
    const { visitedSections } = getState();
    if (visitedSections.length >= 3 && unlockAchievement('explore-hub')) {
      unlocked.push('explore-hub');
    }
  }

  if (trigger === 'select-knowledge') {
    if (unlockAchievement('select-knowledge')) unlocked.push('select-knowledge');
  }

  if (trigger === 'chat') {
    if (unlockAchievement('first-chat')) unlocked.push('first-chat');
    const count = incrementChatCount();
    if (count >= 5 && unlockAchievement('chat-master')) unlocked.push('chat-master');
  }

  if (trigger === 'upload') {
    if (unlockAchievement('upload-file')) unlocked.push('upload-file');
  }

  if (trigger === 'preview') {
    if (unlockAchievement('preview-file')) unlocked.push('preview-file');
  }

  if (trigger === 'team') {
    if (unlockAchievement('view-team')) unlocked.push('view-team');
  }

  unlocked.forEach(showAchievementToast);
  updateAchievementBadge();
  return unlocked;
}

export function trackHubSection(section) {
  markSectionVisited(section);
  checkAchievements('hub-section');
}

function showAchievementToast(id) {
  const achievement = achievementsList.find(a => a.id === id);
  if (!achievement) return;

  const toast = document.getElementById('achievement-toast');
  if (!toast) return;

  toast.innerHTML = `${achievement.icon} Achievement Unlocked: <strong>${achievement.title}</strong>`;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

export function updateAchievementBadge() {
  const badge = document.getElementById('achievement-badge');
  if (!badge) return;

  const total = getUnlockedAchievements().length;
  const hasNew = total > 0 && total < achievementsList.length;
  badge.classList.toggle('visible', hasNew);
}

export function renderAchievementModal() {
  const list = document.getElementById('achievement-list');
  if (!list) return;

  const unlocked = getUnlockedAchievements();

  list.innerHTML = `
    <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.9rem;">
      ${unlocked.length} of ${achievementsList.length} achievements unlocked
    </p>
    <div class="achievement-grid">
      ${achievementsList.map(a => `
        <div class="achievement-item ${unlocked.includes(a.id) ? 'unlocked' : ''}">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-info">
            <h4>${a.title}</h4>
            <p>${a.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function initAchievements() {
  const btn = document.getElementById('achievement-btn');
  const modal = document.getElementById('achievement-modal');

  btn?.addEventListener('click', () => {
    renderAchievementModal();
    modal?.showModal();
  });

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
      el.closest('dialog')?.close();
    });
  });

  checkAchievements('visit');
  updateAchievementBadge();
}

export { getKnowledgeFiles };
