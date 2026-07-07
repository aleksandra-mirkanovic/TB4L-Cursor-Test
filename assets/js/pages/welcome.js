export function renderWelcome() {
  return `
    <section class="hero">
      <div class="hero-badge">
        <span class="pulse-dot"></span>
        Think Big for Life Platform
      </div>
      <h1>Unlock Innovation with<br/><span class="gradient-text">TB4L</span></h1>
      <p class="hero-sub">
        Your all-in-one platform for brand strategy, consumer insights, and AI-powered collaboration.
        Explore resources, chat with intelligence, and accelerate your TB4L journey.
      </p>
      <div class="hero-cta">
        <a href="#/hub" class="btn btn-primary btn-lg" data-nav>Explore TB4L Hub</a>
        <a href="#/chat" class="btn btn-secondary btn-lg" data-nav>Launch TB4L Chat</a>
      </div>
    </section>

    <div class="stats-row">
      <div class="card stat-card">
        <div class="stat-value">48+</div>
        <div class="stat-label">Playbooks & Templates</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">12</div>
        <div class="stat-label">Accelerator Cohorts</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">2.4k</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">89%</div>
        <div class="stat-label">Satisfaction Rate</div>
      </div>
    </div>

    <div class="features-grid">
      <div class="card feature-card card-glow">
        <div class="feature-icon chat">💬</div>
        <h3>TB4L Chat</h3>
        <p>
          An AI-powered assistant trained on TB4L methodologies. Ask questions, brainstorm strategies,
          and get contextual answers powered by your selected knowledge files.
        </p>
        <ul class="feature-list">
          <li>Live direct connections + uploaded files</li>
          <li>Streaming replies with copy & regenerate</li>
          <li>Background sources bar shows active feeds</li>
          <li>Multi-model support (demo)</li>
        </ul>
        <a href="#/chat" class="btn btn-primary" data-nav>Open TB4L Chat →</a>
      </div>

      <div class="card feature-card card-glow">
        <div class="feature-icon hub">📚</div>
        <h3>TB4L Hub</h3>
        <p>
          Your central resource library — playbooks, templates, brand files, training schedules,
          accelerator outputs, and everything your team needs to Think Big for Life.
        </p>
        <ul class="feature-list">
          <li>Playbooks, templates & brand strategy files</li>
          <li>Direct connections — M360, BHT, FICO & more</li>
          <li>Upload data files by type with AI descriptions</li>
          <li>Preview files with AI-generated summaries</li>
        </ul>
        <a href="#/hub" class="btn btn-accent-2" data-nav>Visit TB4L Hub →</a>
      </div>
    </div>

    <section class="how-it-works">
      <h2 class="section-title">The TB4L Framework</h2>
      <p class="section-sub">Define and Design — one unified platform experience</p>
      <div class="steps steps-pillars">
        <div class="card step-card pillar-define">
          <div class="step-num">1</div>
          <span class="pillar-label">Define</span>
          <h4>Select Knowledge</h4>
          <p>Explore the Hub, then choose the files and sources TB4L Chat should reference. Build your personalised knowledge base.</p>
        </div>
        <div class="card step-card pillar-design">
          <div class="step-num">2</div>
          <span class="pillar-label">Design</span>
          <h4>Shape & Create</h4>
          <p>Draft strategies, map demand spaces, and turn insights into action with AI-assisted templates, playbooks, and chat.</p>
        </div>
      </div>
    </section>
  `;
}

export function initWelcome() {
  /* static page — nav handled globally */
}
