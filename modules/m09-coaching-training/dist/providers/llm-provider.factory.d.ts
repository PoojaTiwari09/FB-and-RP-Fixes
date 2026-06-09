import { ILlmProvider } from './llm-provider.interface';
export type LlmProviderKind = 'mock' | 'groq' | 'openai' | 'gemini';
export declare function resolveLlmProviderKind(env?: NodeJS.ProcessEnv): {
    kind: LlmProviderKind;
    reason: string;
};
export declare function createMockProvider(): ILlmProvider;
