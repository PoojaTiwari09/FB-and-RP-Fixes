import { ILlmProvider } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';

export type LlmProviderKind = 'mock' | 'groq' | 'openai' | 'gemini';

/**
 * Resolves the active LLM provider from M09_LLM_PROVIDER / AI_MOCK_MODE / API keys.
 * Groq/OpenAI/Gemini concrete providers are wired inside LlmService (legacy methods);
 * this factory owns mock + selection policy for smoke reporting.
 */
export function resolveLlmProviderKind(env: NodeJS.ProcessEnv = process.env): {
  kind: LlmProviderKind;
  reason: string;
} {
  const forced = (env.M09_LLM_PROVIDER || '').toLowerCase();
  if (forced === 'mock' || env.AI_MOCK_MODE === 'true') {
    return { kind: 'mock', reason: 'AI_MOCK_MODE or M09_LLM_PROVIDER=mock' };
  }
  if (forced === 'openai' && env.OPENAI_API_KEY) {
    return { kind: 'openai', reason: 'M09_LLM_PROVIDER=openai' };
  }
  if (forced === 'gemini' && (env.GEMINI_API_KEY || env.GOOGLE_API_KEY)) {
    return { kind: 'gemini', reason: 'M09_LLM_PROVIDER=gemini' };
  }
  if (forced === 'groq' && env.GROQ_API_KEY) {
    return { kind: 'groq', reason: 'M09_LLM_PROVIDER=groq' };
  }
  if (!env.GROQ_API_KEY) {
    return { kind: 'mock', reason: 'GROQ_API_KEY missing' };
  }
  return { kind: 'groq', reason: 'default (GROQ_API_KEY present)' };
}

export function createMockProvider(): ILlmProvider {
  return new MockLlmProvider();
}
