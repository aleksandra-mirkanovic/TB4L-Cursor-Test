# TB4L Platform — Demo Website

A modern, marketing-oriented demo website for **Think Big for Life (TB4L)** featuring three main experiences:

- **Welcome** — Marketing landing page introducing TB4L Hub and TB4L Chat
- **TB4L Chat** — AI chat interface with streaming responses, knowledge base, and modern UX
- **TB4L Hub** — Resource library with playbooks, templates, training, brand files, and more

## Quick Start

### Run the site (1 click)

1. Open folder: `c:\Users\GODLI\Cursor test\tb4l-site`
2. **Double-click `START-SITE.bat`**
3. Your browser opens at **http://localhost:5500**

Keep the black terminal window open while using the site. Close it (or press Ctrl+C) to stop.

### Push to GitHub (1 click)

1. Create an **empty** repo on GitHub (no README)
2. **Double-click `PUSH-TO-GITHUB.bat`**
3. Paste your repo URL the first time — it’s saved for next time
4. Sign in when Git asks (use a Personal Access Token as the password)

To change the saved repo URL later, delete the file `.github-repo-url` and run the script again.

### Manual start (terminal)

```powershell
cd "c:\Users\GODLI\Cursor test\tb4l-site"
py -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

> **Note:** Port `5500` is used instead of `8080` to avoid conflicts with other apps on your PC.

### Option 1: Open directly (limited)
Open `index.html` in your browser. Note: ES modules may require a local server on some browsers.

### Option 2: Local server (recommended)

**Python:**
```bash
cd tb4l-site
python -m http.server 8080
```
Then visit http://localhost:8080

**Node.js (if installed):**
```bash
cd tb4l-site
npx serve .
```

**VS Code / Cursor:** Use the "Live Server" extension and open `index.html`.

## Features (Demo)

- 🏠 **Welcome Page** — Hero, stats, feature cards, how-it-works flow
- 💬 **TB4L Chat** — Streaming AI responses, conversation history, knowledge base integration, quick prompts, copy/regenerate
- 📚 **TB4L Hub** — 9 sections: Playbooks, Templates, Training, Brand & Strategy (upload + tags), Accelerator Outputs, Glossary, FAQs, Team, Support
- 🧠 **Knowledge Selection** — Select Hub files to use as chat context
- 👁️ **File Preview & Summary** — Preview modal with AI-generated summaries
- 🏆 **Achievements** — Unlock badges as you explore the platform
- 💾 **Persistent State** — Selections and achievements saved in localStorage

## Demo Notice

All features are simulated for demonstration purposes. No real AI, file storage, or backend is connected.
