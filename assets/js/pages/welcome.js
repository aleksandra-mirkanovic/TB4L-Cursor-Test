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
          <li>Context-aware responses from Hub resources</li>
          <li>Streaming replies with copy & regenerate</li>
          <li>Quick prompts and conversation history</li>
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
          <li>Upload & tag your own brand materials</li>
          <li>Select files as chat knowledge sources</li>
          <li>Preview files with AI-generated summaries</li>
        </ul>
        <a href="#/hub" class="btn btn-accent-2" data-nav>Visit TB4L Hub →</a>
      </div>
    </div>

    <section class="how-it-works">
      <h2 class="section-title">How It Works</h2>
      <p class="section-sub">Three steps to accelerate your TB4L innovation journey</p>
      <div class="steps">
        <div class="card step-card">
          <div class="step-num">1</div>
          <h4>Explore the Hub</h4>
          <p>Browse playbooks, templates, and brand files. Upload your own materials with custom tags.</p>
        </div>
        <div class="card step-card">
          <div class="step-num">2</div>
          <h4>Select Knowledge</h4>
          <p>Choose the files you want TB4L Chat to reference. Build your personalized knowledge base.</p>
        </div>
        <div class="card step-card">
          <div class="step-num">3</div>
          <h4>Chat & Create</h4>
          <p>Ask questions, draft strategies, and get AI-powered insights grounded in your selected resources.</p>
        </div>
      </div>
    </section>
  `;
}

export function initWelcome() {
  /* static page — nav handled globally */
}
