import {
  playbooks, templates, brandFiles, acceleratorOutputs,
  trainingSessions, glossary, faqs, team,
  directConnections, sourceFileGroups, getKnowledgeItem,
  generateAITags, searchHubWithAI, allResources,
  getPopularResources, getRecommendedResources, getRecentlyUpdatedResources,
  getPinnedResources, getRelatedResources, withHubMeta,
  generateMarketingSummary,
} from '../data/demo-data.js';
import {
  toggleKnowledge, isKnowledgeSelected, getKnowledgeFiles,
  addUploadedFile, getUploadedFiles, addUploadedSourceFile, getUploadedSourceFiles,
  toggleBookmark, isBookmarked, getBookmarks,
  dismissHubOnboarding, isHubOnboardingDismissed,
  isUserUploadedFile, removeUploadedFile, removeUploadedSourceFile,
} from '../state.js';
import { checkAchievements, trackHubSection } from '../achievements.js';

const hubNavBrowse = [
  { id: 'home', icon: '✨', label: 'Hub Home' },
  { id: 'playbooks', icon: '📖', label: 'Playbooks' },
  { id: 'templates', icon: '📋', label: 'Templates' },
  { id: 'training', icon: '🎓', label: 'TB4L Training' },
  { id: 'accelerator', icon: '🚀', label: 'Accelerator Outputs' },
  { id: 'glossary', icon: '📕', label: 'TB4L Glossary' },
  { id: 'faqs', icon: '❓', label: 'FAQs' },
  { id: 'team', icon: '👥', label: 'Team' },
  { id: 'support', icon: '🛠️', label: 'Support' },
];

const hubNavUpload = [
  { id: 'sources', icon: '🔌', label: 'Sources', uploadHint: 'Data & research files' },
  { id: 'brand', icon: '🎨', label: 'Brand & Strategy', uploadHint: 'Brand strategy files' },
];

const hubSections = [...hubNavBrowse, ...hubNavUpload];

let currentSection = 'home';
let searchQuery = '';
let uploadedBrandFiles = [];
let activeFileGroup = null;
let showUploadForm = false;
let hubAiResults = null;
let hubAiQuery = '';
let hubListFilter = 'all';
let deleteUploadListenerBound = false;

export function renderHub(section = 'home') {
  currentSection = section;
  const knowledgeIds = getKnowledgeFiles();
  const knowledgeItems = knowledgeIds
    .map(id => getKnowledgeItem(id, getUploadedSourceFiles(), getUploadedFiles()))
    .filter(Boolean);
  const connectionCount = knowledgeItems.filter(k => k.sourceType === 'connection' || k.type === 'connection').length;
  const fileCount = knowledgeItems.length - connectionCount;

  return `
    <div class="hub-layout">
      <nav class="hub-nav glass" aria-label="Hub sections">
        <div class="hub-nav-group">
          <span class="hub-nav-group-label">Browse</span>
          ${hubNavBrowse.map(s => renderHubNavItem(s)).join('')}
        </div>
        <div class="hub-nav-divider" aria-hidden="true"></div>
        <div class="hub-nav-group hub-nav-group-upload">
          <span class="hub-nav-group-label">Upload your files</span>
          <p class="hub-nav-upload-note">Only these two sections accept uploads</p>
          ${hubNavUpload.map(s => renderHubNavItem(s, { upload: true })).join('')}
        </div>
      </nav>

      <div class="hub-content">
        ${renderHubAIBar()}
        ${hubAiResults ? renderHubAIResults() : ''}
        <div id="hub-section-content">
          ${renderSectionContent(currentSection)}
        </div>

        ${knowledgeItems.length > 0 ? `
          <div class="knowledge-bar glass">
            <div class="knowledge-bar-info">
              <span class="knowledge-count">${knowledgeItems.length}</span>
              <span>source${knowledgeItems.length > 1 ? 's' : ''} active for chat</span>
              ${connectionCount ? `<span class="tag tag-live">${connectionCount} direct</span>` : ''}
              ${fileCount ? `<span class="tag">${fileCount} file${fileCount > 1 ? 's' : ''}</span>` : ''}
            </div>
            <a href="#/chat" class="btn btn-primary btn-sm" data-nav>Chat with Sources →</a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getUploadCounts() {
  return {
    sources: getUploadedSourceFiles().length,
    brand: getUploadedFiles().length,
  };
}

function renderHubNavItem(section, { upload = false } = {}) {
  const counts = getUploadCounts();
  const count = section.id === 'sources' ? counts.sources : section.id === 'brand' ? counts.brand : 0;

  return `
    <button
      type="button"
      class="hub-nav-item ${upload ? 'hub-nav-item-upload' : ''} ${section.id === currentSection ? 'active' : ''}"
      data-hub-section="${section.id}"
    >
      <span class="hub-nav-icon">${section.icon}</span>
      <span class="hub-nav-text">
        <span class="hub-nav-label">${section.label}</span>
        ${upload && section.uploadHint ? `<span class="hub-nav-sublabel">${section.uploadHint}</span>` : ''}
      </span>
      ${upload ? '<span class="hub-nav-upload-badge">Upload</span>' : ''}
      ${upload && count ? `<span class="hub-nav-count">${count}</span>` : ''}
    </button>
  `;
}

function renderReadOnlyNotice() {
  return `
    <div class="hub-readonly-notice" role="note">
      <span class="hub-readonly-icon" aria-hidden="true">📚</span>
      <div class="hub-readonly-copy">
        <strong>Curated library — browse only</strong>
        <p>Want to add your own files? Upload in
          <button type="button" class="hub-readonly-link" data-hub-section="sources">Sources</button>
          or
          <button type="button" class="hub-readonly-link" data-hub-section="brand">Brand &amp; Strategy</button>.
        </p>
      </div>
    </div>
  `;
}

function renderUploadZoneHero({ title, description, ctaLabel, ctaTarget, icon = '📤' }) {
  return `
    <div class="hub-upload-hero glass">
      <div class="hub-upload-hero-badge">Upload zone</div>
      <div class="hub-upload-hero-body">
        <span class="hub-upload-hero-icon" aria-hidden="true">${icon}</span>
        <div>
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </div>
      ${ctaLabel && ctaTarget ? `<button type="button" class="btn btn-primary btn-sm" data-jump-upload-tab="${ctaTarget}">${ctaLabel}</button>` : ''}
    </div>
  `;
}

function renderHubAIBar() {
  return `
    <div class="hub-ai-bar glass">
      <div class="hub-ai-browse">
        <span class="hub-ai-icon" aria-hidden="true">✨</span>
        <input
          type="text"
          class="hub-ai-input"
          id="hub-ai-search"
          placeholder="Describe what you're looking for — e.g. Dove brand strategy UK"
          value="${hubAiQuery}"
        />
        <button type="button" class="btn btn-primary btn-sm" id="hub-ai-search-btn">AI Browse</button>
      </div>
    </div>
  `;
}

function renderHubAIResults() {
  if (!hubAiResults?.length) {
    return `
      <div class="hub-ai-results glass">
        <p class="hub-ai-results-msg">No matches found. Try different keywords.</p>
        <button type="button" class="btn btn-ghost btn-sm" id="hub-ai-clear">Clear results</button>
      </div>
    `;
  }

  return `
    <div class="hub-ai-results glass">
      <div class="hub-ai-results-header">
        <p class="hub-ai-results-msg">✨ AI found <strong>${hubAiResults.length}</strong> resource${hubAiResults.length > 1 ? 's' : ''} for "${hubAiQuery}"</p>
        <button type="button" class="btn btn-ghost btn-sm" id="hub-ai-clear">Clear</button>
      </div>
      <div class="hub-ai-results-grid">
        ${hubAiResults.map(item => `
          <div class="card hub-ai-result-card" data-resource-id="${item.id}">
            <span class="resource-type type-${item.type || 'playbook'}">${item.type || 'resource'}</span>
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <div class="resource-tags">${(item.tags || []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}</div>
            <div class="resource-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-drawer="${item.id}">Quick view</button>
              <button type="button" class="btn btn-secondary btn-sm" data-summary="${item.id}">Key insights</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getAllBrowsableResources() {
  return [
    ...allResources(),
    ...getUploadedFiles().map(withHubMeta),
    ...getUploadedSourceFiles().map(withHubMeta),
  ];
}

function renderHubOnboarding() {
  if (isHubOnboardingDismissed()) return '';
  return `
    <div class="hub-onboarding glass" id="hub-onboarding">
      <div class="hub-onboarding-icon">✨</div>
      <div class="hub-onboarding-copy">
        <h3>Welcome to TB4L Hub</h3>
        <p><strong>Searching?</strong> Use AI Browse, popular picks, and saved items. <strong>Maintaining?</strong> Pin strategic docs and track freshness at a glance.</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" id="hub-onboarding-dismiss">Got it</button>
    </div>
  `;
}

function renderFreshnessBadge(item) {
  if (!item.updatedLabel) return '';
  const labels = { fresh: 'Fresh', current: 'Current', aging: 'Review' };
  return `
    <span class="freshness-badge freshness-${item.freshness || 'current'}" title="Updated ${item.updatedLabel}">
      <span class="freshness-dot"></span>${labels[item.freshness] || 'Current'} · ${item.updatedLabel}
    </span>
  `;
}

function canDeleteUpload(item) {
  return Boolean(item?.id && (item.userUploaded || isUserUploadedFile(item.id)));
}

function deleteUserUpload(id) {
  if (!isUserUploadedFile(id)) return;

  const resource = getResourceById(id);
  const name = resource?.title || 'this file';
  if (!confirm(`Remove "${name}"? This cannot be undone.`)) return;

  const isSource = getUploadedSourceFiles().some(f => f.id === id);
  const removed = isSource ? removeUploadedSourceFile(id) : removeUploadedFile(id);
  if (!removed) return;

  uploadedBrandFiles = uploadedBrandFiles.filter(f => f.id !== id);
  closePreviewDrawer();
  document.getElementById('preview-modal')?.close();
  showDemoToast('🗑️ File removed');
  rerenderHub();
}

function renderResourceCard(item, typeClass, { compact = false } = {}) {
  const selected = isKnowledgeSelected(item.id);
  const bookmarked = isBookmarked(item.id);
  const typeLabel = item.type || typeClass;
  const displayTags = (item.aiTags || item.tags || []).slice(0, compact ? 2 : 6);

  return `
    <article class="card resource-card hub-card ${selected ? 'selected' : ''} ${compact ? 'hub-card-compact' : ''}" data-resource-id="${item.id}">
      <div class="hub-card-top">
        <span class="resource-type type-${typeLabel}">${typeLabel}</span>
        ${item.popular ? '<span class="hub-signal hub-signal-popular">Popular this week</span>' : ''}
        ${item.pinned ? '<span class="hub-signal hub-signal-pinned">Pinned</span>' : ''}
        ${item.recommended && !item.popular ? '<span class="hub-signal hub-signal-rec">Recommended</span>' : ''}
        <div class="hub-card-actions-top">
          <button type="button" class="hub-icon-btn ${bookmarked ? 'active' : ''}" data-bookmark="${item.id}" title="${bookmarked ? 'Remove bookmark' : 'Save for later'}">${bookmarked ? '★' : '☆'}</button>
          <button type="button" class="hub-icon-btn select-checkbox" data-toggle-knowledge="${item.id}" title="Use in chat">${selected ? '✓' : '+'}</button>
        </div>
      </div>
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      ${renderFreshnessBadge(item)}
      ${item.aiDescription && !compact ? `<p class="ai-file-hint">${item.aiDescription}</p>` : ''}
      <div class="resource-tags">${displayTags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="resource-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-drawer="${item.id}">Quick view</button>
        <button type="button" class="btn btn-secondary btn-sm" data-summary="${item.id}">Key insights</button>
        ${canDeleteUpload(item) ? `<button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-delete-upload="${item.id}">Remove</button>` : ''}
      </div>
    </article>
  `;
}

function renderContentRail(title, subtitle, items, emptyMsg) {
  if (!items.length) {
    return `
      <section class="hub-rail">
        <div class="hub-rail-header"><div><h3>${title}</h3><p>${subtitle}</p></div></div>
        <div class="hub-empty-inline">${emptyMsg}</div>
      </section>
    `;
  }
  return `
    <section class="hub-rail">
      <div class="hub-rail-header">
        <div><h3>${title}</h3><p>${subtitle}</p></div>
      </div>
      <div class="hub-rail-scroll">
        ${items.map(item => renderResourceCard(item, item.type, { compact: true })).join('')}
      </div>
    </section>
  `;
}

function renderHubHome() {
  const bookmarks = getBookmarks()
    .map(id => getResourceById(id))
    .filter(Boolean);

  return `
    ${renderHubOnboarding()}
    <div class="hub-home-header">
      <h2>Your TB4L knowledge hub</h2>
      <p>Find answers, bookmark resources, and keep strategic content fresh — all in one place.</p>
    </div>
    <div class="hub-home-panels">
      ${renderContentRail('Recommended for you', 'Curated based on your role and recent activity', getRecommendedResources().slice(0, 4), 'No recommendations yet — explore playbooks to get started.')}
      ${renderContentRail('Popular this week', 'What teams are opening most across TB4L', getPopularResources().slice(0, 4), 'Popularity data will appear as the community engages.')}
      ${renderContentRail('Recently updated', 'Fresh knowledge with clear freshness signals', getRecentlyUpdatedResources().slice(0, 4), 'No recent updates in this view.')}
      ${renderContentRail('Saved for later', 'Your bookmarked resources', bookmarks, 'Bookmark resources with ☆ to build your personal reading list.')}
      ${renderContentRail('Pinned strategic documents', 'Core references maintained by your TB4L team', getPinnedResources(), 'No pinned documents yet. Pin key playbooks and brand files for everyone.')}
      ${renderContentRail('Needs attention', 'Content approaching review — keep knowledge trustworthy', getRecentlyUpdatedResources().filter(r => r.freshness !== 'fresh').slice(0, 4), 'All strategic content is current.')}
      <section class="hub-upload-destinations glass">
        <div class="hub-upload-destinations-header">
          <span class="hub-upload-hero-badge">Where to upload</span>
          <h3>Add your own files to the Hub</h3>
          <p>Only two sections accept uploads — everything else is curated TB4L content.</p>
        </div>
        <div class="hub-upload-destination-grid">
          <button type="button" class="hub-upload-destination-card" data-hub-section="sources">
            <span class="hub-upload-destination-icon">🔌</span>
            <strong>Sources</strong>
            <span>Research, tracker, and data files</span>
            <span class="hub-nav-upload-badge">Upload</span>
          </button>
          <button type="button" class="hub-upload-destination-card" data-hub-section="brand">
            <span class="hub-upload-destination-icon">🎨</span>
            <strong>Brand &amp; Strategy</strong>
            <span>Brand decks, strategy docs, briefs</span>
            <span class="hub-nav-upload-badge">Upload</span>
          </button>
        </div>
      </section>
      <section class="hub-maintain-cta glass">
        <div>
          <h3>Maintain the knowledge base</h3>
          <p>Upload brand files, tag sources with AI, and keep playbooks fresh for your team.</p>
        </div>
        <div class="hub-maintain-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-hub-section="brand">Upload brand file</button>
          <button type="button" class="btn btn-primary btn-sm" data-hub-section="sources">Manage sources</button>
        </div>
      </section>
    </div>
  `;
}

function renderStickyFilters(sectionLabel) {
  return `
    <div class="hub-sticky-toolbar glass">
      <div class="hub-filter-chips" role="tablist" aria-label="Filter ${sectionLabel}">
        <button type="button" class="hub-filter-chip ${hubListFilter === 'all' ? 'active' : ''}" data-hub-filter="all">All</button>
        <button type="button" class="hub-filter-chip ${hubListFilter === 'bookmarked' ? 'active' : ''}" data-hub-filter="bookmarked">Saved</button>
        <button type="button" class="hub-filter-chip ${hubListFilter === 'fresh' ? 'active' : ''}" data-hub-filter="fresh">Recently updated</button>
        <button type="button" class="hub-filter-chip ${hubListFilter === 'popular' ? 'active' : ''}" data-hub-filter="popular">Popular</button>
        <button type="button" class="hub-filter-chip ${hubListFilter === 'pinned' ? 'active' : ''}" data-hub-filter="pinned">Pinned</button>
      </div>
      <input type="search" class="search-input hub-sticky-search" placeholder="Search ${sectionLabel.toLowerCase()}..." value="${searchQuery}" id="hub-search" />
    </div>
  `;
}

function applyListFilter(items) {
  let list = filterItems(items);
  switch (hubListFilter) {
    case 'bookmarked': list = list.filter(i => isBookmarked(i.id)); break;
    case 'fresh': list = list.filter(i => i.freshness === 'fresh'); break;
    case 'popular': list = list.filter(i => i.popular); break;
    case 'pinned': list = list.filter(i => i.pinned); break;
    default: break;
  }
  return list;
}

function renderEmptyState(title, message, actionLabel, actionSection) {
  return `
    <div class="hub-empty-state">
      <div class="hub-empty-icon">🔍</div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${actionSection ? `<button type="button" class="btn btn-secondary btn-sm" data-hub-section="${actionSection}">${actionLabel}</button>` : ''}
    </div>
  `;
}

function renderSectionContent(section) {
  trackHubSection(section);

  switch (section) {
    case 'home': return renderHubHome();
    case 'playbooks': return renderResourceSection('Playbooks', 'Proven methodologies and process guides for TB4L execution.', playbooks, 'playbook');
    case 'templates': return renderResourceSection('Templates', 'Ready-to-use frameworks and document templates for your TB4L projects.', templates, 'template');
    case 'sources': return renderSources();
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
  const enriched = items.map(withHubMeta);
  const filtered = applyListFilter(enriched);

  return `
    ${renderReadOnlyNotice()}
    <div class="hub-section-header">
      <h2>${title}</h2>
      <p>${desc}</p>
    </div>
    ${renderStickyFilters(title)}
    <div class="resource-grid">
      ${filtered.map(item => renderResourceCard(item, typeClass)).join('')}
    </div>
    ${filtered.length === 0 ? renderEmptyState(
      hubListFilter === 'all' ? 'No results' : `No ${hubListFilter} items`,
      hubListFilter === 'all'
        ? 'Try a different search term or use AI Browse above.'
        : 'Try another filter or save resources with ☆ for quick access.',
      'Explore Hub Home',
      'home'
    ) : ''}
  `;
}

/* legacy card placeholder removed */

function renderActiveChatSources() {
  const ids = getKnowledgeFiles();
  if (!ids.length) return '';

  const items = ids
    .map(id => getKnowledgeItem(id, getUploadedSourceFiles(), getUploadedFiles()))
    .filter(Boolean);

  return `
    <div class="active-chat-sources glass">
      <div class="active-chat-header">
        <span class="sidebar-label" style="margin:0">Active in Chat</span>
        <button type="button" class="btn btn-ghost btn-sm" data-disconnect-all>Disconnect all</button>
      </div>
      <div class="active-chat-list">
        ${items.map(item => {
          const isConn = item.sourceType === 'connection' || item.type === 'connection';
          const label = isConn ? `${item.code} — ${item.name}` : item.title;
          const icon = isConn ? '🔌' : '📄';
          const typeLabel = isConn ? 'Direct' : (item.groupLabel || item.type || 'File');

          return `
            <div class="active-chat-item">
              <span class="active-chat-icon">${icon}</span>
              <div class="active-chat-info">
                <strong>${label}</strong>
                <span class="tag">${typeLabel}</span>
              </div>
              <button type="button" class="btn-disconnect" data-disconnect="${item.id}" title="Disconnect from chat">Disconnect</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderSources() {
  const uploadedSources = getUploadedSourceFiles();
  const connectedCount = directConnections.filter(c => c.connected).length;

  return `
    ${renderUploadZoneHero({
      title: 'Upload data & research files here',
      description: 'This is one of two upload zones in the Hub. Add tracker exports, research files, and source data — AI will tag them for chat.',
      ctaLabel: 'Start uploading',
      ctaTarget: 'files',
      icon: '🔌',
    })}

    <div class="hub-section-header">
      <h2>Sources</h2>
      <p>Live data feeds and uploaded files for TB4L Chat. Connect platforms or upload your own files below.</p>
    </div>

    ${renderActiveChatSources()}

    <div class="sources-tabs">
      <button class="sources-tab active" data-sources-tab="connections">Direct Connections</button>
      <button class="sources-tab sources-tab-upload" data-sources-tab="files">
        Uploaded Files
        <span class="sources-tab-upload-badge">Upload here</span>
      </button>
    </div>

    <div id="sources-tab-connections" class="sources-panel">
      <div class="sources-summary glass">
        <span class="conn-stat"><strong>${connectedCount}</strong> of ${directConnections.length} connected</span>
        <span class="conn-stat-hint">Platform connection status — feeds sync automatically when connected</span>
      </div>
      <div class="connections-grid">
        ${directConnections.map(conn => {
          const statusClass = conn.connected ? 'conn-live' : 'conn-offline';
          const statusLabel = conn.connected ? 'Connected' : 'Not connected';

          return `
            <div class="card connection-card ${conn.connected ? 'conn-active' : 'connection-disabled'}" data-connection-id="${conn.id}">
              <div class="connection-header">
                <div class="connection-code">${conn.code}</div>
                <span class="connection-status ${statusClass}">
                  <span class="status-indicator"></span>
                  ${statusLabel}
                </span>
              </div>
              <h4>${conn.name}</h4>
              <p>${conn.description}</p>
              <div class="connection-meta ${conn.connected ? '' : 'offline-meta'}">
                ${conn.connected
                  ? `<span>Last sync: ${conn.lastSync}</span>`
                  : `<span>Connection not established</span>
                     <button type="button" class="btn btn-secondary btn-sm" data-request-conn="${conn.id}">Request Access</button>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div id="sources-tab-files" class="sources-panel" style="display:none">
      ${renderFilesPanel(uploadedSources)}
    </div>
  `;
}

function renderFilesPanel(uploadedSources) {
  const totalFiles = uploadedSources.length;
  const activeGroup = activeFileGroup ? sourceFileGroups.find(g => g.id === activeFileGroup) : null;
  const activeFiles = activeGroup ? uploadedSources.filter(f => f.groupId === activeGroup.id) : [];

  return `
    <div class="files-panel-top files-panel-top-upload">
      <div>
        <span class="hub-upload-hero-badge">Upload here</span>
        <span class="files-count">${totalFiles} file${totalFiles !== 1 ? 's' : ''} uploaded by you</span>
      </div>
      <span class="files-hint">Choose a file type below, then drag & drop or browse to upload</span>
    </div>

    <div class="file-types-grid">
      ${sourceFileGroups.map(group => {
        const count = uploadedSources.filter(f => f.groupId === group.id).length;
        const isActive = activeFileGroup === group.id;
        const shortLabel = group.label.replace('Brand Health Tracker', 'Brand Health').replace('Usage & Attitude (U&A)', 'U&A').replace('Brand Activation Pulse (BAP)', 'BAP').replace('Penetration Monthly Track (PMT)', 'PMT').replace('Campaign Tracker / BLS', 'Campaign / BLS').replace('Integrated Marketing Planning', 'IMP');

        return `
          <button type="button" class="file-type-tile ${isActive ? 'active' : ''}" data-select-group="${group.id}">
            <span class="ft-icon">${group.icon}</span>
            <span class="ft-label">${shortLabel}</span>
            ${count ? `<span class="ft-badge">${count}</span>` : ''}
          </button>
        `;
      }).join('')}
    </div>

    ${activeGroup ? `
      <div class="file-group-detail glass">
        <div class="file-detail-header">
          <div>
            <h4>${activeGroup.icon} ${activeGroup.label}</h4>
            <p>${activeGroup.description}</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-open-upload="${activeGroup.id}">${showUploadForm ? 'Hide upload' : activeGroup.uploadLabel}</button>
        </div>

        ${showUploadForm ? `
          <div class="file-upload-compact">
            <div class="upload-row">
              <div class="source-upload-drop source-upload-drop-sm" data-group-upload="${activeGroup.id}">
                <span>📤</span>
                <span>Choose file</span>
                <input type="file" hidden data-file-input="${activeGroup.id}" accept=".csv,.xlsx,.xls,.pdf,.pptx,.docx" />
              </div>
              <input class="form-input" data-upload-name="${activeGroup.id}" placeholder="File name" />
            </div>
            <div class="ai-tags-preview" data-ai-preview="${activeGroup.id}" hidden>
              <span class="sidebar-label">AI suggested tags</span>
              <div class="ai-tags-chips" data-ai-tags="${activeGroup.id}"></div>
            </div>
            <textarea class="form-input upload-desc" data-upload-desc="${activeGroup.id}" rows="2" placeholder="AI will describe this file when you upload — or edit here"></textarea>
            <div class="source-upload-actions">
              <button class="btn btn-primary btn-sm" data-confirm-source="${activeGroup.id}">Save & Add to Chat</button>
              <button class="btn btn-ghost btn-sm" data-cancel-source="${activeGroup.id}">Cancel</button>
            </div>
          </div>
        ` : ''}

        ${activeFiles.length ? `
          <div class="file-list-compact">
            ${activeFiles.map(f => `
              <div class="file-row ${isKnowledgeSelected(f.id) ? 'selected' : ''}">
                <div class="file-row-main">
                  <strong>${f.title}</strong>
                  ${f.aiDescription ? `<span class="file-row-desc" title="${f.aiDescription}">${f.aiDescription}</span>` : ''}
                  ${(f.aiTags || f.tags || []).length ? `
                    <div class="file-row-tags">
                      ${(f.aiTags || f.tags).map(t => `<span class="tag tag-sm">${t}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
                <div class="file-row-actions">
                  <button class="btn ${isKnowledgeSelected(f.id) ? 'btn-disconnect-sm' : 'btn-secondary'} btn-sm" data-toggle-source="${f.id}">
                    ${isKnowledgeSelected(f.id) ? 'Disconnect' : 'Add to Chat'}
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-delete-upload="${f.id}">Remove</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `<p class="source-empty-inline">No files in this category yet.</p>`}
      </div>
    ` : `
      <div class="file-group-placeholder glass">
        <span>👆</span> Select a file type above to upload or view files
      </div>
    `}

    ${totalFiles > 0 ? `
      <div class="all-files-strip">
        <div class="sidebar-label">All uploads</div>
        <div class="all-files-scroll">
          ${uploadedSources.map(f => `
            <div class="file-chip ${isKnowledgeSelected(f.id) ? 'active' : ''}" data-jump-group="${f.groupId}" title="${f.aiDescription || f.title}">
              <span class="file-chip-type">${sourceFileGroups.find(g => g.id === f.groupId)?.icon || '📁'}</span>
              <span class="file-chip-name">${f.title}</span>
              ${isKnowledgeSelected(f.id)
                ? `<button type="button" class="file-chip-disconnect" data-disconnect="${f.id}" title="Disconnect from chat">×</button>`
                : `<button type="button" class="file-chip-toggle" data-toggle-source="${f.id}" title="Add to chat">+</button>`
              }
              <button type="button" class="file-chip-delete" data-delete-upload="${f.id}" title="Remove file">🗑</button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function renderTraining() {
  return `
    ${renderReadOnlyNotice()}
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
  return `
    ${renderUploadZoneHero({
      title: 'Upload brand & strategy files here',
      description: 'This is one of two upload zones in the Hub. Drag and drop decks, briefs, and strategy documents — AI suggests tags automatically.',
      icon: '🎨',
    })}

    <div class="hub-section-header">
      <h2>Brand & Strategy</h2>
      <p>Your uploads appear below alongside curated brand files. Tag by brand, country, year, and demand space.</p>
    </div>

    <div class="upload-zone upload-zone-prominent" id="upload-zone">
      <div class="upload-zone-label">Drop files here</div>
      <div class="upload-icon">📤</div>
      <h4>Upload Brand File</h4>
      <p>Drag & drop or click to browse — PDF, PowerPoint, Word, or Excel</p>
      <input type="file" id="file-input" hidden accept=".pdf,.pptx,.docx,.xlsx" />
    </div>

    <div class="card" id="upload-form-card" style="display:none;margin-bottom:28px">
      <h4 style="margin-bottom:8px">Tag Your Upload</h4>
      <p class="ai-upload-hint">AI will suggest brand, market, and file type when you select a file.</p>
      <div class="ai-tags-preview" id="brand-ai-preview" hidden>
        <span class="sidebar-label">AI suggested tags</span>
        <div class="ai-tags-chips" id="brand-ai-tags"></div>
      </div>
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

    <div class="hub-toolbar hub-sticky-toolbar glass">
      <input type="search" class="search-input hub-sticky-search" placeholder="Search brand files..." id="hub-search" />
      <select class="filter-select" id="brand-filter">
        <option value="">All Brands</option>
        <option value="Dove">Dove</option>
        <option value="Axe">Axe</option>
        <option value="Hellmann's">Hellmann's</option>
      </select>
    </div>

    <div class="resource-grid">
      ${applyListFilter([...brandFiles, ...uploadedBrandFiles, ...getUploadedFiles()].map(withHubMeta)).map(item => renderResourceCard(item, 'brand')).join('')}
    </div>
  `;
}

function renderGlossary() {
  const filtered = glossary.filter(g =>
    !searchQuery || g.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return `
    ${renderReadOnlyNotice()}
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
    ${renderReadOnlyNotice()}
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
    ${renderReadOnlyNotice()}
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
    ${renderReadOnlyNotice()}
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

function renderMarketingSummaryHTML(resource, { compact = false } = {}) {
  const insight = generateMarketingSummary(resource);
  if (!insight) return '';

  if (compact) {
    return `
      <div class="ai-insight-panel ai-insight-compact">
        <div class="ai-insight-header">
          <span class="ai-insight-badge">✨ Key insights</span>
          <span class="ai-insight-type">${insight.typeLabel}</span>
        </div>
        <h3 class="ai-insight-headline">${insight.headline}</h3>
        <ul class="ai-insight-list">${insight.highlights.slice(0, 2).map(h => `<li>${h}</li>`).join('')}</ul>
      </div>
    `;
  }

  return `
    <div class="ai-insight-panel">
      <div class="ai-insight-header">
        <span class="ai-insight-badge">✨ Key insights</span>
        <span class="ai-insight-type">${insight.typeLabel}</span>
      </div>
      <h3 class="ai-insight-headline">${insight.headline}</h3>
      ${insight.tagline ? `<p class="ai-insight-tagline">${insight.tagline}</p>` : ''}
      <div class="ai-insight-section">
        <h5>What you'll get</h5>
        <ul class="ai-insight-list">${insight.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>
      <div class="ai-insight-section ai-insight-why">
        <h5>Why it matters</h5>
        <p>${insight.whyItMatters}</p>
      </div>
      <div class="ai-insight-meta-grid">
        <div class="ai-insight-meta-card">
          <span class="ai-insight-meta-label">Best for</span>
          <p>${insight.bestFor}</p>
        </div>
        <div class="ai-insight-meta-card ai-insight-next">
          <span class="ai-insight-meta-label">Try this next</span>
          <p>${insight.nextStep}</p>
        </div>
      </div>
    </div>
  `;
}

function getResourceById(id) {
  return getKnowledgeItem(id, getUploadedSourceFiles(), [...uploadedBrandFiles, ...getUploadedFiles()]);
}

function showPreviewDrawer(resource) {
  const drawer = document.getElementById('preview-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const title = document.getElementById('drawer-title');
  const type = document.getElementById('drawer-type');
  const body = document.getElementById('drawer-body');
  const footer = document.getElementById('drawer-footer');
  if (!drawer || !body || !title) return;

  const related = getRelatedResources(resource.id);

  title.textContent = resource.title;
  if (type) type.textContent = resource.type || 'Resource';

  body.innerHTML = `
    ${renderFreshnessBadge(resource)}
    ${renderMarketingSummaryHTML(resource, { compact: true })}
    <div class="preview-meta">${(resource.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    ${related.length ? `
      <div class="drawer-related">
        <h4>Related resources</h4>
        <div class="drawer-related-list">
          ${related.map(r => `
            <button type="button" class="drawer-related-item" data-drawer="${r.id}">
              <span class="resource-type type-${r.type}">${r.type}</span>
              <span>${r.title}</span>
            </button>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  footer.innerHTML = `
    <button type="button" class="btn btn-ghost btn-sm" data-drawer-bookmark="${resource.id}">
      ${isBookmarked(resource.id) ? '★ Saved' : '☆ Save for later'}
    </button>
    <button type="button" class="btn btn-secondary btn-sm" data-preview-select="${resource.id}">
      ${isKnowledgeSelected(resource.id) ? '✓ In chat' : '+ Add to chat'}
    </button>
    <button type="button" class="btn btn-primary btn-sm" data-summary="${resource.id}">Full insights</button>
    ${canDeleteUpload(resource) ? `<button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-delete-upload="${resource.id}">Remove</button>` : ''}
  `;

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop?.removeAttribute('hidden');
  document.body.classList.add('drawer-open');
  checkAchievements('preview');
  bindDrawerEvents();
}

function closePreviewDrawer() {
  document.getElementById('preview-drawer')?.classList.remove('open');
  document.getElementById('preview-drawer')?.setAttribute('aria-hidden', 'true');
  document.getElementById('drawer-backdrop')?.setAttribute('hidden', '');
  document.body.classList.remove('drawer-open');
}

function bindDrawerEvents() {
  document.getElementById('drawer-close')?.addEventListener('click', closePreviewDrawer, { once: true });
  document.getElementById('drawer-backdrop')?.addEventListener('click', closePreviewDrawer, { once: true });

  document.querySelectorAll('#drawer-body [data-drawer]').forEach(btn => {
    btn.addEventListener('click', () => {
      const resource = getResourceById(btn.dataset.drawer);
      if (resource) showPreviewDrawer(resource);
    });
  });

  document.querySelectorAll('#drawer-footer [data-drawer-bookmark]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBookmark(btn.dataset.drawerBookmark);
      showDemoToast(isBookmarked(btn.dataset.drawerBookmark) ? '★ Saved for later' : 'Removed bookmark');
      const resource = getResourceById(btn.dataset.drawerBookmark);
      if (resource) showPreviewDrawer(resource);
      else rerenderHub();
    });
  });

  document.querySelectorAll('#drawer-footer [data-preview-select]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleKnowledge(btn.dataset.previewSelect);
      checkAchievements('select-knowledge');
      showDemoToast('Added to TB4L Chat sources');
      closePreviewDrawer();
      rerenderHub();
    });
  });

  document.querySelectorAll('#drawer-footer [data-summary]').forEach(btn => {
    btn.addEventListener('click', () => {
      const resource = getResourceById(btn.dataset.summary);
      closePreviewDrawer();
      if (resource) showPreview(resource, 'summary');
    });
  });

  document.querySelectorAll('#drawer-footer [data-delete-upload]').forEach(btn => {
    btn.addEventListener('click', () => deleteUserUpload(btn.dataset.deleteUpload));
  });
}

function showPreview(resource, mode = 'preview') {
  const modal = document.getElementById('preview-modal');
  const title = document.getElementById('preview-title');
  const body = document.getElementById('preview-body');

  if (!modal || !title || !body) return;

  title.textContent = mode === 'summary' ? 'Key insights' : resource.title;

  const metaTags = [
    resource.brand && `Brand: ${resource.brand}`,
    resource.country && `Country: ${resource.country}`,
    resource.year && `Year: ${resource.year}`,
    resource.demandSpace && `Demand Space: ${resource.demandSpace}`,
    ...(resource.tags || []),
  ].filter(Boolean);

  body.innerHTML = mode === 'summary' ? `
    <p class="ai-insight-modal-title">${resource.title}</p>
    <div class="preview-meta">
      ${metaTags.map(t => `<span class="tag">${t}</span>`).join('')}
    </div>
    ${renderMarketingSummaryHTML(resource)}
    <div class="preview-actions">
      <button class="btn btn-primary btn-sm" data-preview-select="${resource.id}">
        ${isKnowledgeSelected(resource.id) ? '✓ In chat' : '+ Add to chat'}
      </button>
      <button class="btn btn-ghost btn-sm" data-preview-mode="document">View document</button>
      ${canDeleteUpload(resource) ? `<button class="btn btn-ghost btn-sm btn-danger-text" data-delete-upload="${resource.id}">Remove</button>` : ''}
      <button class="btn btn-secondary btn-sm" data-close-modal>Close</button>
    </div>
  ` : `
    <div class="preview-meta">
      ${metaTags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <div class="preview-content">
      ${(resource.preview || resource.description).replace(/\n/g, '<br/>').replace(/## (.*?)(<br\/>|$)/g, '<h4 style="color:var(--accent-text);margin:16px 0 8px">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
    </div>
    <div class="preview-actions">
      <button class="btn btn-primary btn-sm" data-preview-select="${resource.id}">
        ${isKnowledgeSelected(resource.id) ? '✓ Selected as Knowledge' : '+ Use as Chat Knowledge'}
      </button>
      <button class="btn btn-secondary btn-sm" data-summary="${resource.id}">Key insights</button>
      ${canDeleteUpload(resource) ? `<button class="btn btn-ghost btn-sm btn-danger-text" data-delete-upload="${resource.id}">Remove</button>` : ''}
      <button class="btn btn-ghost btn-sm" data-close-modal>Close</button>
    </div>
  `;

  body.querySelector('[data-preview-select]')?.addEventListener('click', () => {
    toggleKnowledge(resource.id);
    checkAchievements('select-knowledge');
    modal.close();
    rerenderHub();
  });

  body.querySelector('[data-summary]')?.addEventListener('click', () => {
    showPreview(resource, 'summary');
  });

  body.querySelector('[data-preview-mode="document"]')?.addEventListener('click', () => {
    showPreview(resource, 'preview');
  });

  body.querySelector('[data-delete-upload]')?.addEventListener('click', () => {
    deleteUserUpload(resource.id);
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

export function initHub(section = 'home') {
  currentSection = section;
  uploadedBrandFiles = [];

  document.getElementById('hub-onboarding-dismiss')?.addEventListener('click', () => {
    dismissHubOnboarding();
    document.getElementById('hub-onboarding')?.remove();
  });

  document.querySelectorAll('[data-hub-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSection = btn.dataset.hubSection;
      searchQuery = '';
      hubListFilter = 'all';
      rerenderHub();
      history.replaceState(null, '', `#/hub/${currentSection}`);
    });
  });

  document.querySelectorAll('[data-hub-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      hubListFilter = chip.dataset.hubFilter;
      const content = document.getElementById('hub-section-content');
      if (content) {
        content.innerHTML = renderSectionContent(currentSection);
        bindSectionEvents();
        initHubFilterChips();
      }
    });
  });

  document.getElementById('hub-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    const content = document.getElementById('hub-section-content');
    if (content) {
      content.innerHTML = renderSectionContent(currentSection);
      bindSectionEvents();
      initHubFilterChips();
    }
  });

  bindSectionEvents();
  initHubAI();
  initHubFilterChips();
  initDrawerGlobal();
  bindDeleteUploadEvents();
}

function initHubFilterChips() {
  document.querySelectorAll('[data-hub-filter]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.hubFilter === hubListFilter);
  });
}

function initDrawerGlobal() {
  document.getElementById('drawer-close')?.addEventListener('click', closePreviewDrawer);
  document.getElementById('drawer-backdrop')?.addEventListener('click', closePreviewDrawer);
}

function initHubAI() {
  document.getElementById('hub-ai-search-btn')?.addEventListener('click', runHubAIBrowse);
  document.getElementById('hub-ai-search')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runHubAIBrowse();
  });
  document.getElementById('hub-ai-clear')?.addEventListener('click', () => {
    hubAiResults = null;
    hubAiQuery = '';
    rerenderHub();
  });
}

function runHubAIBrowse() {
  hubAiQuery = document.getElementById('hub-ai-search')?.value?.trim() || '';
  hubAiResults = searchHubWithAI(hubAiQuery, getAllBrowsableResources());
  rerenderHub();
  if (hubAiQuery) {
    showDemoToast(hubAiResults.length
      ? `✨ AI found ${hubAiResults.length} match${hubAiResults.length > 1 ? 'es' : ''}`
      : 'No matches — try different keywords');
  }
}

function bindSectionEvents() {
  document.querySelectorAll('[data-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(btn.dataset.bookmark);
      showDemoToast(isBookmarked(btn.dataset.bookmark) ? '★ Saved for later' : 'Removed from saved');
      rerenderHub();
    });
  });

  document.querySelectorAll('[data-toggle-knowledge]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKnowledge(btn.dataset.toggleKnowledge);
      checkAchievements('select-knowledge');
      rerenderHub();
    });
  });

  document.querySelectorAll('[data-drawer]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const resource = getResourceById(btn.dataset.drawer);
      if (resource) showPreviewDrawer(resource);
    });
  });

  document.querySelectorAll('[data-preview]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const resource = getResourceById(btn.dataset.preview);
      if (resource) showPreviewDrawer(resource);
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
  initSourcesEvents();
}

function bindDeleteUploadEvents() {
  if (deleteUploadListenerBound) return;
  deleteUploadListenerBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-delete-upload]');
    if (!btn || !document.getElementById('app')?.contains(btn)) return;
    e.stopPropagation();
    deleteUserUpload(btn.dataset.deleteUpload);
  });
}

function initSourcesEvents() {
  document.querySelectorAll('[data-jump-upload-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchSourcesTab(btn.dataset.jumpUploadTab || 'files');
    });
  });

  document.querySelectorAll('[data-sources-tab]').forEach(tab => {
    tab.addEventListener('click', () => switchSourcesTab(tab.dataset.sourcesTab));
  });

  document.querySelectorAll('[data-request-conn]').forEach(btn => {
    btn.addEventListener('click', () => showDemoToast('📨 Access request sent (demo)'));
  });

  document.querySelectorAll('[data-disconnect]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKnowledge(btn.dataset.disconnect);
      showDemoToast('Disconnected from chat');
      rerenderHub();
    });
  });

  document.querySelectorAll('[data-disconnect-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      [...getKnowledgeFiles()].forEach(id => toggleKnowledge(id));
      showDemoToast('All sources disconnected');
      rerenderHub();
    });
  });

  bindFilesPanelEvents();
}

function switchSourcesTab(target) {
  document.querySelectorAll('[data-sources-tab]').forEach(t => {
    t.classList.toggle('active', t.dataset.sourcesTab === target);
  });
  const connections = document.getElementById('sources-tab-connections');
  const files = document.getElementById('sources-tab-files');
  if (connections) connections.style.display = target === 'connections' ? 'block' : 'none';
  if (files) files.style.display = target === 'files' ? 'block' : 'none';
  if (target === 'files') {
    showDemoToast('📤 Upload your data files here');
  }
}

function refreshFilesPanel() {
  const panel = document.getElementById('sources-tab-files');
  if (!panel || currentSection !== 'sources') return;
  panel.innerHTML = renderFilesPanel(getUploadedSourceFiles());
  bindFilesPanelEvents();
}

function bindFilesPanelEvents() {
  document.querySelectorAll('[data-select-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.selectGroup;
      activeFileGroup = activeFileGroup === id ? null : id;
      showUploadForm = false;
      refreshFilesPanel();
    });
  });

  document.querySelectorAll('[data-open-upload]').forEach(btn => {
    btn.addEventListener('click', () => {
      showUploadForm = !showUploadForm;
      refreshFilesPanel();
    });
  });

  document.querySelectorAll('[data-jump-group]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.file-chip-toggle') || e.target.closest('.file-chip-disconnect') || e.target.closest('.file-chip-delete')) return;
      activeFileGroup = chip.dataset.jumpGroup;
      showUploadForm = false;
      refreshFilesPanel();
    });
  });

  document.querySelectorAll('[data-group-upload]').forEach(zone => {
    const groupId = zone.dataset.groupUpload;
    const input = document.querySelector(`[data-file-input="${groupId}"]`);

    zone.addEventListener('click', () => input?.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      showUploadForm = true;
      refreshFilesPanel();
      const fileName = e.dataTransfer?.files?.[0]?.name || 'uploaded-file.csv';
      setTimeout(() => applySourceAITags(groupId, fileName), 50);
      showDemoToast('📄 File received — AI tagging...');
    });
    input?.addEventListener('change', () => {
      if (input.files?.length) {
        showUploadForm = true;
        refreshFilesPanel();
        setTimeout(() => applySourceAITags(groupId, input.files[0].name), 50);
      }
    });
  });

  document.querySelectorAll('[data-confirm-source]').forEach(btn => {
    btn.addEventListener('click', () => {
      const groupId = btn.dataset.confirmSource;
      const group = sourceFileGroups.find(g => g.id === groupId);
      const name = document.querySelector(`[data-upload-name="${groupId}"]`)?.value || `${group?.label} Upload`;
      const aiDescription = document.querySelector(`[data-upload-desc="${groupId}"]`)?.value || '';
      const ai = generateAITags(name, { groupLabel: group?.label });

      const file = {
        id: `src-${Date.now()}`,
        title: name,
        description: aiDescription || ai.aiDescription,
        aiDescription: aiDescription || ai.aiDescription,
        groupId,
        groupLabel: group?.label,
        type: 'source',
        sourceType: 'file',
        brand: ai.brand,
        market: ai.market,
        country: ai.market,
        aiTags: ai.tags,
        tags: ai.tags,
        aiTagged: true,
        summary: aiDescription || `Source file: ${name} (${group?.label}). ${ai.aiDescription}`,
        preview: `## ${name}\n\n**Type:** ${group?.label}\n**Brand:** ${ai.brand}\n**Market:** ${ai.market}\n\n**About this file:**\n${aiDescription || ai.aiDescription}`,
      };

      addUploadedSourceFile(file);
      toggleKnowledge(file.id);
      activeFileGroup = groupId;
      showUploadForm = false;
      checkAchievements('upload');
      checkAchievements('select-knowledge');
      showDemoToast('✅ File saved and added to chat sources!');
      rerenderHub();
    });
  });

  document.querySelectorAll('[data-cancel-source]').forEach(btn => {
    btn.addEventListener('click', () => {
      showUploadForm = false;
      refreshFilesPanel();
    });
  });

  document.querySelectorAll('[data-toggle-source]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = isKnowledgeSelected(btn.dataset.toggleSource);
      toggleKnowledge(btn.dataset.toggleSource);
      checkAchievements('select-knowledge');
      showDemoToast(wasActive ? 'Disconnected from chat' : 'Added to chat');
      rerenderHub();
    });
  });

  document.querySelectorAll('[data-disconnect]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKnowledge(btn.dataset.disconnect);
      showDemoToast('Disconnected from chat');
      rerenderHub();
    });
  });
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
    const fileName = e.dataTransfer?.files?.[0]?.name || 'brand-strategy.pdf';
    setTimeout(() => applyBrandAITags(fileName), 50);
    showDemoToast('📄 File received — AI tagging...');
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length) {
      formCard.style.display = 'block';
      applyBrandAITags(fileInput.files[0].name);
    }
  });

  document.getElementById('confirm-upload')?.addEventListener('click', () => {
    const name = document.getElementById('upload-name')?.value || 'Uploaded Brand File';
    const ai = generateAITags(name, { fileType: 'Brand Strategy' });
    const brand = document.getElementById('upload-brand')?.value || ai.brand;
    const country = document.getElementById('upload-country')?.value || ai.market;
    const year = document.getElementById('upload-year')?.value || '2026';
    const demand = document.getElementById('upload-demand')?.value || ai.fileType;
    const aiTags = [...new Set([brand, country, year, demand, 'AI-tagged'])];

    const file = {
      id: `upload-${Date.now()}`,
      title: name,
      description: `Uploaded brand strategy file for ${brand}.`,
      type: 'brand',
      brand, country, year,
      market: country,
      demandSpace: demand,
      aiTags,
      tags: aiTags,
      aiTagged: true,
      aiDescription: `AI tagged: ${brand} · ${country} · ${demand}`,
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

function applySourceAITags(groupId, fileName) {
  const group = sourceFileGroups.find(g => g.id === groupId);
  const ai = generateAITags(fileName, { groupLabel: group?.label });
  const nameInput = document.querySelector(`[data-upload-name="${groupId}"]`);
  const descInput = document.querySelector(`[data-upload-desc="${groupId}"]`);

  if (nameInput && !nameInput.value) {
    nameInput.value = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }
  if (descInput) descInput.value = ai.aiDescription;

  const preview = document.querySelector(`[data-ai-preview="${groupId}"]`);
  const chips = document.querySelector(`[data-ai-tags="${groupId}"]`);
  if (preview && chips) {
    chips.innerHTML = ai.tags.map(t => `<span class="tag tag-ai">${t}</span>`).join('');
    preview.hidden = false;
  }
  showDemoToast('✨ AI tagged: brand, file type & market');
}

function applyBrandAITags(fileName) {
  const ai = generateAITags(fileName, { fileType: 'Brand Strategy' });
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  };

  setVal('upload-name', fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  setVal('upload-brand', ai.brand);
  setVal('upload-country', ai.market);
  setVal('upload-year', '2026');
  setVal('upload-demand', ai.fileType);

  const preview = document.getElementById('brand-ai-preview');
  const chips = document.getElementById('brand-ai-tags');
  if (preview && chips) {
    chips.innerHTML = ai.tags.map(t => `<span class="tag tag-ai">${t}</span>`).join('');
    preview.hidden = false;
  }
  showDemoToast('✨ AI auto-tagged your upload');
}

function showDemoToast(msg) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  toast.innerHTML = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
