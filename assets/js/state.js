const STORAGE_KEY = 'tb4l-demo-state';

const defaultState = {
  knowledgeFiles: [],
  unlockedAchievements: [],
  visitedSections: [],
  chatCount: 0,
  uploadedFiles: [],
  uploadedSourceFiles: [],
  firstVisit: true,
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* demo — ignore */ }
}

export function getState() {
  return state;
}

export function toggleKnowledge(fileId) {
  const idx = state.knowledgeFiles.indexOf(fileId);
  if (idx >= 0) {
    state.knowledgeFiles.splice(idx, 1);
  } else {
    state.knowledgeFiles.push(fileId);
  }
  persist();
  return state.knowledgeFiles;
}

export function isKnowledgeSelected(fileId) {
  return state.knowledgeFiles.includes(fileId);
}

export function getKnowledgeFiles() {
  return [...state.knowledgeFiles];
}

export function addUploadedFile(file) {
  state.uploadedFiles.push(file);
  persist();
}

export function addUploadedSourceFile(file) {
  state.uploadedSourceFiles.push(file);
  persist();
}

export function getUploadedFiles() {
  return [...state.uploadedFiles];
}

export function getUploadedSourceFiles() {
  return [...state.uploadedSourceFiles];
}

export function getActiveSourceCount() {
  return state.knowledgeFiles.length;
}

export function getAllFiles() {
  return state.uploadedFiles;
}

export function incrementChatCount() {
  state.chatCount++;
  persist();
  return state.chatCount;
}

export function markSectionVisited(section) {
  if (!state.visitedSections.includes(section)) {
    state.visitedSections.push(section);
    persist();
  }
}

export function unlockAchievement(id) {
  if (!state.unlockedAchievements.includes(id)) {
    state.unlockedAchievements.push(id);
    persist();
    return true;
  }
  return false;
}

export function isAchievementUnlocked(id) {
  return state.unlockedAchievements.includes(id);
}

export function getUnlockedAchievements() {
  return [...state.unlockedAchievements];
}

export function markFirstVisitDone() {
  state.firstVisit = false;
  persist();
}

export function isFirstVisit() {
  return state.firstVisit;
}
