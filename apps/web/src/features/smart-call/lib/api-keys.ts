export type SmartCallApiKeys = {
  groq: string;
  openRouter: string;
};

const GROQ_KEY = 'smart_call_groq_api_key';
const OR_KEY = 'smart_call_openrouter_api_key';

export function loadSmartCallApiKeys(): SmartCallApiKeys {
  if (typeof window === 'undefined') return { groq: '', openRouter: '' };
  return {
    groq: localStorage.getItem(GROQ_KEY)?.trim() ?? '',
    openRouter: localStorage.getItem(OR_KEY)?.trim() ?? '',
  };
}

export function saveSmartCallApiKeys(keys: SmartCallApiKeys) {
  localStorage.setItem(GROQ_KEY, keys.groq.trim());
  localStorage.setItem(OR_KEY, keys.openRouter.trim());
}

export function hasUsableGroqKey(keys: SmartCallApiKeys): boolean {
  return Boolean(keys.groq?.trim());
}
