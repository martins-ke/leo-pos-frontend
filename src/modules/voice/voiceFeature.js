const STORAGE_KEY = 'leo_voice_enabled';

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const memoryStore = globalThis.__leoMemoryStore || (globalThis.__leoMemoryStore = {});
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null),
    setItem: (key, value) => {
      memoryStore[key] = String(value);
    },
    removeItem: (key) => {
      delete memoryStore[key];
    },
  };
}

export function getVoiceFeatureFlag() {
  try {
    return getStorage().getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setVoiceFeatureFlag(value) {
  try {
    const nextValue = value ? 'true' : 'false';
    getStorage().setItem(STORAGE_KEY, nextValue);
    return nextValue === 'true';
  } catch {
    return false;
  }
}

export function isVoiceFeatureSupported() {
  const hasBrowserSpeech = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasSpeechSynthesis = typeof window !== 'undefined' && !!window.speechSynthesis;
  return hasBrowserSpeech && hasSpeechSynthesis;
}

export function buildAiAssistantRequest(question, context = {}) {
  const safeQuestion = typeof question === 'string' ? question.trim() : '';

  if (!safeQuestion) {
    throw new Error('A valid user question is required.');
  }

  const sanitizedQuestion = safeQuestion
    .replace(/--.*$/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/;[\s\S]*$/g, ' ')
    .replace(/\b(?:DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|EXEC|UNION|SELECT)\b[\s\S]*$/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);

  if (!sanitizedQuestion) {
    throw new Error('A valid user question is required.');
  }

  return {
    question: sanitizedQuestion,
    userRole: context.userRole || 'STAFF',
    activeShopId: context.activeShopId || '',
    requestedAt: new Date().toISOString(),
    allowSql: false,
    allowedResources: ['sales', 'inventory', 'customers', 'expenses', 'accounts', 'products', 'dashboard'],
  };
}
