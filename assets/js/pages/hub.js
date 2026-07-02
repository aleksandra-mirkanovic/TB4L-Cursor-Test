import {
  playbooks, templates, brandFiles, acceleratorOutputs,
  trainingSessions, glossary, faqs, team,
} from '../data/demo-data.js';
import {
  toggleKnowledge, isKnowledgeSelected, getKnowledgeFiles,
  addUploadedFile, getUploadedFiles,
} from '../state.js';
import { checkAchievements, trackHubSection } from '../achievements.js';

const hubSections = [
  { id: 'playbooks', icon: '📖', label: 'Playbooks' },
  { id: 'templates', icon: '📋', label: 'Templates' },
  { id: 'training', icon: '🎓', label: 'TB4L Training' },
  { id: 'brand', icon: '🎨', label: 'Brand & Strategy' },
  { id: 'accelerator', icon: '🚀', label: 'Accelerator Outputs' },
  { id: 'glossary', icon: '📕', label: 'TB4L Glossary' },
  { id: 'faqs', icon: '❓', label: 'FAQs' },
  { id: 'team', icon: '👥', label: 'Team' },
  { id: 'support', icon: '🛠️', label: 'Support' },
];

let currentSection = 'playbooks';
let searchQuery = '';
let uploadedBrandFiles = [];

export function renderHub(section = 'playbooks') {
  currentSection = section;
  const knowledgeCount = getKnowledgeFiles().length;

  return `
    <div class="hub-layout">
      <nav class="hub-nav glass" aria-label="Hub sections">
        ${hubSections.map(s => `
          <button class="hub-nav-item ${s.id === currentSection ? 'active' : ''}" data-hub-section="${s.id}">
            <span class="hub-nav-icon">${s.icon}</span>
            ${s.label}
          </button>
        `).join('')}
      </nav>

      <div class="hub-content">
        <div id="hub-section-content">
          ${renderSectionContent(currentSection)}
        </div>

        ${knowledgeCount > 0 ? `
          <div class="knowledge-bar glass">
            <div class="knowledge-bar-info">
              <span class="knowledge-count">${knowledgeCount}</span>
              <span>file${knowledgeCount > 1 ? 's' : ''} selected as chat knowledge</span>
            </div>
            <a href="#/chat" class="btn btn-primary btn-sm" data-nav>Chat with Knowledge →</a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderSectionContent(section) {
  trackHubSection(section);

  switch (section) {
    case 'playbooks': return renderResourceSection('Playbooks', 'Proven methodologies and process guides for TB4L execution.', playbooks, 'playbook');
    case 'templates': return renderResourceSection('Templates', 'Ready-to-use frameworks and document templates for your TB4L projects.', templates, 'template');
    case 'training': return renderTraining();
    case 'brand': return renderBrandStrategy();
    case 'accelerator': return renderResourceSection('Accelerator Outputs', 'Innovations and outputs from past TB4L accelerator cohorts.', acceleratorOutputs, 'accelerator');
    case 'glossary': return renderGlossary();
    case 'faqs': return renderFaqs();
    case 'team': return renderTeam();
    case 'support': return renderSupport();
    default: return renderResourceSection('Playbooks', '', playbooks, 'playbook');
  }
}

function renderResourceSection(title, desc, items, typeClass) {
  const filtered = filterItems(items);

  return `
    <div class="hub-section-header">
      <h2>${title}</h2>
      <p>${desc}</p>
    </div>
    <div class="hub-toolbar">
      <input type="search" class="search-input" placeholder="Search ${title.toLowerCase()}..." value="${searchQuery}" id="hub-search" />
    </div>
    <div class="resource-grid">
      ${filtered.map(item => renderResourceCard(item, typeClass)).join('')}
    </div>
    ${filtered.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:40px">No results found.</p>' : ''}
  `;
}

function renderResourceCard(item, typeClass) {
  const selected = isKnowledgeSelected(item.id);
  const typeLabel = item.type || typeClass;

  return `
    <div class="card resource-card ${selected ? 'selected' : ''}" data-resource-id="${item.id}">
      <div class="select-checkbox" title="Use as chat knowledge">${selected ? '✓' : ''}</div>
      <span class="resource-type type-${typeLabel}">${typeLabel}</span>
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <div class="resource-tags">
        ${(item.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="resource-actions">
        <button class="btn btn-ghost btn-sm" data-preview="${item.id}">Preview</button>
        <button class="btn btn-secondary btn-sm" data-summary="${item.id}">Summary</button>
      </div>
    </div>
  `;
}

function renderTraining() {
  return `
    <div class="hub-section-header">
      <h2>TB4L Training</h2>
      <p>Upcoming workshops, masterclasses, and training sessions. Register to secure your spot.</p>
    </div>
    <div class="training-list">
      ${trainingSessions.map(s => {
        const d = new Date(s.date);
        const month = d.toLocaleString('en', { month: 'short' });
        const day = d.getDate();
        const statusClass = s.status === 'open' ? 'status-open' : s.status === 'full' ? 'status-full' : 'status-soon';
        const statusLabel = s.status === 'open' ? 'Open' : s.status === 'full' ? 'Full' : 'Coming Soon';

        return `
          <div class="card training-card">
            <div class="training-date">
              <div class="month">${month}</div>
              <div class="day">${day}</div>
            </div>
            <div class="training-info">
              <h4>${s.title}</h4>
              <p>${s.description}</p>
              <p style="font-size:0.8rem;color:var(--text-dim);margin-top:6px">${s.time} · ${s.location}</p>
            </div>
            <div>
              <span class="training-status ${statusClass}">${statusLabel}</span>
              ${s.status === 'open' ? `<button class="btn btn-primary btn-sm" style="margin-top:10px;display:block;width:100%" data-register="${s.id}">Register</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderBrandStrategy() {
  const allBrand = [...brandFiles, ...uploadedBrandFiles, ...getUploadedFiles()];

  return `
    <div class="hub-section-header">
      <h2>Brand & Strategy</h2>
      <p>Upload and manage brand strategy files. Tag them by brand, country, year, and demand space for easy discovery.</p>
    </div>

    <div class="upload-zone" id="upload-zone">
      <div class="upload-icon">📤</div>
      <h4>Upload Brand File</h4>
      <p>Drag & drop or click to upload (demo — files are simulated)</p>
      <input type="file" id="file-input" hidden accept=".pdf,.pptx,.docx,.xlsx" />
    </div>

    <div class="card" id="upload-form-card" style="display:none;margin-bottom:28px">
      <h4 style="margin-bottom:16px">Tag Your Upload</h4>
      <div class="upload-form">
        <div class="form-group">
          <label>File Name</label>
          <input class="form-input" id="upload-name" placeholder="My Brand Strategy" />
        </div>
        <div class="form-group">
          <label>Brand</label>
          <input class="form-input" id="upload-brand" placeholder="e.g. Dove, Axe" />
        </div>
        <div class="form-group">
          <label>Country</label>
          <input class="form-input" id="upload-country" placeholder="e.g. UK, Global" />
        </div>
        <div class="form-group">
          <label>Year</label>
          <input class="form-input" id="upload-year" placeholder="e.g. 2026" />
        </div>
        <div class="form-group full">
          <label>Demand Space</label>
          <input class="form-input" id="upload-demand" placeholder="e.g. Sustainable Living" />
        </div>
        <div class="form-group full" style="flex-direction:row;gap:12px">
          <button class="btn btn-primary" id="confirm-upload">Save File</button>
          <button class="btn btn-ghost" id="cancel-upload">Cancel</button>
        </div>
      </div>
    </div>

    <div class="hub-toolbar">
      <input type="search" class="search-input" placeholder="Search brand files..." id="hub-search" />
      <select class="filter-select" id="brand-filter">
        <option value="">All Brands</option>
        <option value="Dove">Dove</option>
        <option value="Axe">Axe</option>
        <option value="Hellmann's">Hellmann's</option>
      </select>
    </div>

    <div class="resource-grid">
      ${filterItems(allBrand).map(item => renderResourceCard(item, 'brand')).join('')}
    </div>
  `;
}

function renderGlossary() {
  const filtered = glossary.filter(g =>
    !searchQuery || g.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return `
    <div class="hub-section-header">
      <h2>TB4L Glossary</h2>
      <p>Key terms and definitions for the Think Big for Life framework.</p>
    </div>
    <div class="hub-toolbar">
      <input type="search" class="search-input" placeholder="Search glossary..." value="${searchQuery}" id="hub-search" />
    </div>
    <dl class="glossary-list">
      ${filtered.map(g => `
        <div class="card glossary-item">
          <dt>${g.term}</dt>
          <dd>${g.definition}</dd>
        </div>
      `).join('')}
    </dl>
  `;
}

function renderFaqs() {
  return `
    <div class="hub-section-header">
      <h2>Frequently Asked Questions</h2>
      <p>Common questions about TB4L, the platform, and how to get started.</p>
    </div>
    <div class="faq-list">
      ${faqs.map((f, i) => `
        <div class="card faq-item" data-faq="${i}">
          <button class="faq-question">
            ${f.q}
            <span class="chevron">▼</span>
          </button>
          <div class="faq-answer">
            <div class="faq-answer-inner">${f.a}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTeam() {
  checkAchievements('team');

  return `
    <div class="hub-section-header">
      <h2>TB4L Team</h2>
      <p>Meet the people behind Think Big for Life. Reach out to the right person for your needs.</p>
    </div>
    <div class="team-grid">
      ${team.map(t => `
        <div class="card team-card">
          <div class="team-avatar">${t.initials}</div>
          <h4>${t.name}</h4>
          <div class="team-role">${t.role}</div>
          <div class="team-contact">${t.contact}</div>
          <div class="team-topics">
            ${t.topics.map(topic => `<span class="tag">${topic}</span>`).join('')}
          </div>
          <button class="btn btn-secondary btn-sm" style="margin-top:14px" data-contact="${t.name}">Contact</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSupport() {
  return `
    <div class="hub-section-header">
      <h2>Support</h2>
      <p>Having technical issues? We're here to help. This is a demo — responses are simulated.</p>
    </div>
    <div class="support-grid">
      <div class="card support-option">
        <div class="support-icon">💬</div>
        <h4>Live Chat Support</h4>
        <p>Chat with our support team for immediate help with platform issues.</p>
        <button class="btn btn-primary btn-sm" id="live-support-btn">Start Live Chat</button>
      </div>
      <div class="card support-option">
        <div class="support-icon">📧</div>
        <h4>Email Support</h4>
        <p>Send us a detailed description and we'll respond within 4 business hours.</p>
        <button class="btn btn-secondary btn-sm" id="email-support-btn">tb4l-support@demo.unilever.com</button>
      </div>
      <div class="card support-option">
        <div class="support-icon">📖</div>
        <h4>Help Center</h4>
        <p>Browse guides, tutorials, and troubleshooting articles.</p>
        <button class="btn btn-secondary btn-sm" id="help-center-btn">Browse Articles</button>
      </div>
      <div class="card support-option">
        <div class="support-icon">🐛</div>
        <h4>Report a Bug</h4>
        <p>Found something broken? Let us know so we can fix it.</p>
        <button class="btn btn-secondary btn-sm" id="bug-report-btn">Report Bug</button>
      </div>
    </div>

    <div class="card" style="margin-top:28px;padding:24px">
      <h4 style="margin-bottom:16px">Quick Support Form</h4>
      <div class="upload-form" style="grid-template-columns:1fr">
        <div class="form-group">
          <label>Subject</label>
          <input class="form-input" id="support-subject" placeholder="Brief description of your issue" />
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea class="form-input" id="support-message" rows="4" placeholder="Describe the issue you're experiencing..." style="resize:vertical"></textarea>
        </div>
        <button class="btn btn-primary" id="submit-support" style="justify-self:start">Submit Ticket</button>
      </div>
    </div>
  `;
}

function filterItems(items) {
  return items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q)) ||
      item.brand?.toLowerCase().includes(q)
    );
  });
}

function getResourceById(id) {
  const all = [...playbooks, ...templates, ...brandFiles, ...acceleratorOutputs, ...uploadedBrandFiles, ...getUploadedFiles()];
  return all.find(r => r.id === id);
}

function showPreview(resource, mode = 'preview') {
  const modal = document.getElementById('preview-modal');
  const title = document.getElementById('preview-title');
  const body = document.getElementById('preview-body');

  if (!modal || !title || !body) return;

  title.textContent = resource.title;

  const metaTags = [
    resource.brand && `Brand: ${resource.brand}`,
    resource.country && `Country: ${resource.country}`,
    resource.year && `Year: ${resource.year}`,
    resource.demandSpace && `Demand Space: ${resource.demandSpace}`,
    ...(resource.tags || []),
  ].filter(Boolean);

  body.innerHTML = `
    <div class="preview-meta">
      ${metaTags.map(t => `<span class="tag">${t}</span>`).join('')}
    </div>
    ${mode === 'summary' ? `
      <div class="preview-summary">
        <h4>AI Summary</h4>
        <p>${resource.summary || resource.description}</p>
      </div>
    ` : ''}
    <div class="preview-content">
      ${(resource.preview || resource.description).replace(/\n/g, '<br/>').replace(/## (.*?)(<br\/>|$)/g, '<h4 style="color:var(--accent);margin:16px 0 8px">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
    </div>
    <div class="preview-actions">
      <button class="btn btn-primary btn-sm" data-preview-select="${resource.id}">
        ${isKnowledgeSelected(resource.id) ? '✓ Selected as Knowledge' : '+ Use as Chat Knowledge'}
      </button>
      <button class="btn btn-secondary btn-sm" data-close-modal>Close</button>
    </div>
  `;

  body.querySelector('[data-preview-select]')?.addEventListener('click', () => {
    toggleKnowledge(resource.id);
    checkAchievements('select-knowledge');
    modal.close();
    rerenderHub();
  });

  body.querySelector('[data-close-modal]')?.addEventListener('click', () => modal.close());

  checkAchievements('preview');
  modal.showModal();
}

function rerenderHub() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = renderHub(currentSection);
    initHub(currentSection);
  }
}

export function initHub(section = 'playbooks') {
  currentSection = section;
  uploadedBrandFiles = [];

  document.querySelectorAll('[data-hub-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSection = btn.dataset.hubSection;
      searchQuery = '';
      rerenderHub();
      history.replaceState(null, '', `#/hub/${currentSection}`);
    });
  });

  document.getElementById('hub-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    const content = document.getElementById('hub-section-content');
    if (content) {
      content.innerHTML = renderSectionContent(currentSection);
      bindSectionEvents();
    }
  });

  bindSectionEvents();
}

function bindSectionEvents() {
  document.querySelectorAll('.resource-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-preview]') || e.target.closest('[data-summary]') || e.target.closest('.resource-actions')) return;

      const id = card.dataset.resourceId;
      toggleKnowledge(id);
      checkAchievements('select-knowledge');
      rerenderHub();
    });
  });

  document.querySelectorAll('[data-preview]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const resource = getResourceById(btn.dataset.preview);
      if (resource) showPreview(resource, 'preview');
    });
  });

  document.querySelectorAll('[data-summary]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const resource = getResourceById(btn.dataset.summary);
      if (resource) showPreview(resource, 'summary');
    });
  });

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.faq-item')?.classList.toggle('open');
    });
  });

  document.querySelectorAll('[data-register]').forEach(btn => {
    btn.addEventListener('click', () => showDemoToast('✅ Registration confirmed! (demo)'));
  });

  document.querySelectorAll('[data-contact]').forEach(btn => {
    btn.addEventListener('click', () => showDemoToast(`📧 Opening email to ${btn.dataset.contact} (demo)`));
  });

  initUploadZone();
  initSupport();
}

function initUploadZone() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const formCard = document.getElementById('upload-form-card');

  zone?.addEventListener('click', () => fileInput?.click());

  zone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone?.addEventListener('dragleave', () => zone.classList.remove('dragover'));

  zone?.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    formCard.style.display = 'block';
    showDemoToast('📄 File received (demo)');
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length) formCard.style.display = 'block';
  });

  document.getElementById('confirm-upload')?.addEventListener('click', () => {
    const name = document.getElementById('upload-name')?.value || 'Uploaded Brand File';
    const brand = document.getElementById('upload-brand')?.value || 'Custom';
    const country = document.getElementById('upload-country')?.value || 'Global';
    const year = document.getElementById('upload-year')?.value || '2026';
    const demand = document.getElementById('upload-demand')?.value || 'General';

    const file = {
      id: `upload-${Date.now()}`,
      title: name,
      description: `Uploaded brand strategy file for ${brand}.`,
      type: 'brand',
      brand, country, year,
      demandSpace: demand,
      tags: [brand, country, year, demand],
      summary: `Demo uploaded file: ${name}. Tagged for ${brand} in ${country} (${year}), demand space: ${demand}.`,
      preview: `## ${name}\n\n**Brand:** ${brand}\n**Country:** ${country}\n**Year:** ${year}\n**Demand Space:** ${demand}\n\nThis is a demo uploaded file. In production, the full document content would be displayed here.`,
    };

    addUploadedFile(file);
    uploadedBrandFiles.push(file);
    checkAchievements('upload');
    formCard.style.display = 'none';
    showDemoToast('✅ File uploaded and tagged successfully!');
    rerenderHub();
  });

  document.getElementById('cancel-upload')?.addEventListener('click', () => {
    formCard.style.display = 'none';
  });
}

function initSupport() {
  ['live-support-btn', 'help-center-btn', 'bug-report-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => showDemoToast('🛠️ Support feature (demo)'));
  });

  document.getElementById('email-support-btn')?.addEventListener('click', () => {
    showDemoToast('📧 Email copied: tb4l-support@demo.unilever.com');
  });

  document.getElementById('submit-support')?.addEventListener('click', () => {
    showDemoToast('✅ Support ticket submitted! (demo)');
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
  });
}

function showDemoToast(msg) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  toast.innerHTML = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
