const STORAGE_KEY = 'ri_assemblyai_api_key';

export const ASSEMBLYAI_KEY_HEADER = 'x-assemblyai-api-key';
export const ASSEMBLYAI_KEY_CHANGED_EVENT = 'ri-assemblyai-key-changed';

export function getStoredAssemblyAIKey(): string | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEY)?.trim();
  return value || null;
}

export function setStoredAssemblyAIKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
  clearAssemblyAICache();
  window.dispatchEvent(new Event(ASSEMBLYAI_KEY_CHANGED_EVENT));
}

export function clearStoredAssemblyAIKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  clearAssemblyAICache();
  window.dispatchEvent(new Event(ASSEMBLYAI_KEY_CHANGED_EVENT));
}

export function clearAssemblyAICache(): void {
  if (typeof window === 'undefined') return;
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i);
    if (k?.startsWith('assemblyai_insights_')) {
      sessionStorage.removeItem(k);
    }
  }
}
