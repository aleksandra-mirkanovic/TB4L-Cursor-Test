import { allResources, chatSuggestions, demoResponses } from '../data/demo-data.js';
import { getKnowledgeFiles, toggleKnowledge } from '../state.js';
import { checkAchievements } from '../achievements.js';

let messages = [];
let isTyping = false;
let responseIndex = 0;

export function renderChat() {
  const knowledge = getKnowledgeFiles();
  const resources = allResources();
  const knowledgeItems = knowledge.map(id => resources.find(r => r.id === id)).filter(Boolean);

  return `
    <div class="chat-layout">
      <aside class="chat-sidebar glass">
        <div class="sidebar-section">
          <button class="btn btn-primary btn-sm" style="width:100%" id="new-chat-btn">+ New Chat</button>
        </div>
        <div class="sidebar-section grow">
          <div class="sidebar-label">Recent Conversations</div>
          <div class="conversation-item active" data-conv="current">
            <span>💬</span> TB4L Strategy Session
          </div>
          <div class="conversation-item" data-conv="demo1">
            <span>📋</span> Demand Space Review
          </div>
          <div class="conversation-item" data-conv="demo2">
            <span>🎯</span> Brand Canvas Draft
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-label">Knowledge Base</div>
          ${knowledgeItems.length ? knowledgeItems.map(f => `
            <div class="knowledge-chip">
              <span>📄</span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.title}</span>
              <button class="remove-kb" data-remove-kb="${f.id}" title="Remove">×</button>
            </div>
          `).join('') : '<p style="font-size:0.8rem;color:var(--text-dim)">No files selected. <a href="#/hub" data-nav style="color:var(--accent)">Browse Hub →</a></p>'}
        </div>
      </aside>

      <div class="chat-main glass">
        <div class="chat-toolbar">
          <div class="chat-toolbar-left">
            <select class="model-select" id="model-select">
              <option>TB4L Pro</option>
              <option>TB4L Fast</option>
              <option>TB4L Creative</option>
            </select>
            <div class="chat-status">
              <span class="status-dot"></span>
              ${knowledgeItems.length ? `${knowledgeItems.length} knowledge file${knowledgeItems.length > 1 ? 's' : ''} active` : 'No knowledge selected'}
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" id="clear-chat-btn">Clear</button>
            <a href="#/hub" class="btn btn-secondary btn-sm" data-nav>+ Add Knowledge</a>
          </div>
        </div>

        <div class="messages-area" id="messages-area">
          ${messages.length === 0 ? renderEmptyState() : messages.map(renderMessage).join('')}
        </div>

        <div class="suggestions" id="suggestions">
          ${chatSuggestions.map(s => `<button class="suggestion-chip" data-suggestion="${s}">${s}</button>`).join('')}
        </div>

        <div class="chat-input-area">
          <div class="chat-input-wrap">
            <div class="input-actions">
              <button class="btn-icon" id="attach-btn" title="Attach file (demo)" style="width:36px;height:36px">📎</button>
            </div>
            <textarea class="chat-input" id="chat-input" placeholder="Ask TB4L anything..." rows="1"></textarea>
            <div class="input-actions">
              <button class="btn-icon" id="voice-btn" title="Voice input (demo)" style="width:36px;height:36px">🎤</button>
              <button class="send-btn" id="send-btn" title="Send message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 7-7-7 7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
          </div>
          <p class="chat-disclaimer">TB4L Chat is a demo. Responses are simulated for demonstration purposes.</p>
        </div>
      </div>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="welcome-chat-empty">
      <div style="font-size:3rem;margin-bottom:16px">✨</div>
      <h2>Welcome to TB4L Chat</h2>
      <p>Your AI-powered innovation assistant. Select knowledge from the Hub, then ask anything about TB4L, brand strategy, or your projects.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
        ${chatSuggestions.slice(0, 3).map(s => `<button class="suggestion-chip" data-suggestion="${s}">${s}</button>`).join('')}
      </div>
    </div>
  `;
}

function renderMessage(msg) {
  const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatted = msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  return `
    <div class="message ${msg.role}">
      <div class="message-avatar">${msg.role === 'assistant' ? 'AI' : 'You'}</div>
      <div>
        <div class="message-bubble">${formatted}</div>
        <div class="message-meta">${time}</div>
        ${msg.role === 'assistant' ? `
          <div class="message-actions">
            <button class="msg-action-btn" data-copy="${encodeURIComponent(msg.content)}">Copy</button>
            <button class="msg-action-btn" data-regenerate>Regenerate</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const messagesArea = document.getElementById('messages-area');
  const suggestions = document.getElementById('suggestions');

  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn?.addEventListener('click', sendMessage);

  document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    messages = [];
    responseIndex = 0;
    refreshMessages();
  });

  document.getElementById('clear-chat-btn')?.addEventListener('click', () => {
    messages = [];
    responseIndex = 0;
    refreshMessages();
  });

  document.getElementById('attach-btn')?.addEventListener('click', () => {
    showDemoToast('📎 File attachment is a demo feature');
  });

  document.getElementById('voice-btn')?.addEventListener('click', () => {
    showDemoToast('🎤 Voice input is a demo feature');
  });

  document.querySelectorAll('[data-remove-kb]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleKnowledge(btn.dataset.removeKb);
      rerenderChat();
    });
  });

  bindSuggestions();
  bindMessageActions();

  function sendMessage(text) {
    const content = (text || input?.value || '').trim();
    if (!content || isTyping) return;

    messages.push({ role: 'user', content, time: Date.now() });
    if (input) { input.value = ''; input.style.height = 'auto'; }
    refreshMessages();
    checkAchievements('chat');

    isTyping = true;
    sendBtn.disabled = true;

    const typingEl = document.createElement('div');
    typingEl.className = 'message assistant';
    typingEl.id = 'typing-indicator';
    typingEl.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-bubble typing-indicator"><span></span><span></span><span></span></div>
    `;
    messagesArea?.appendChild(typingEl);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    const response = demoResponses[responseIndex % demoResponses.length];
    responseIndex++;

    streamResponse(response);
  }

  function streamResponse(fullText) {
    let i = 0;
    const msg = { role: 'assistant', content: '', time: Date.now() };

    const interval = setInterval(() => {
      if (i < fullText.length) {
        const chunk = Math.min(3, fullText.length - i);
        msg.content += fullText.slice(i, i + chunk);
        i += chunk;

        const typing = document.getElementById('typing-indicator');
        if (typing) {
          const formatted = msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
          typing.querySelector('.message-bubble').innerHTML = formatted;
          typing.querySelector('.message-bubble').classList.remove('typing-indicator');
        }
        messagesArea.scrollTop = messagesArea.scrollHeight;
      } else {
        clearInterval(interval);
        messages.push(msg);
        isTyping = false;
        sendBtn.disabled = false;
        refreshMessages();
      }
    }, 25);
  }

  function refreshMessages() {
    if (!messagesArea) return;

    if (messages.length === 0) {
      messagesArea.innerHTML = renderEmptyState();
      bindSuggestions();
      return;
    }

    messagesArea.innerHTML = messages.map(renderMessage).join('');
    messagesArea.scrollTop = messagesArea.scrollHeight;
    bindMessageActions();
  }

  function bindSuggestions() {
    document.querySelectorAll('[data-suggestion]').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.dataset.suggestion));
    });
  }

  function bindMessageActions() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(decodeURIComponent(btn.dataset.copy));
        showDemoToast('Copied to clipboard');
      });
    });

    document.querySelectorAll('[data-regenerate]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isTyping) return;
        const response = demoResponses[responseIndex % demoResponses.length];
        responseIndex++;
        isTyping = true;
        streamResponse(response);
      });
    });
  }
}

function rerenderChat() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = renderChat();
    initChat();
  }
}

function showDemoToast(msg) {
  const toast = document.getElementById('achievement-toast');
  if (!toast) return;
  toast.innerHTML = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
