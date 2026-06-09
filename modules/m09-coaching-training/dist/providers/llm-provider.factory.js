"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLlmProviderKind = resolveLlmProviderKind;
exports.createMockProvider = createMockProvider;
const mock_llm_provider_1 = require("./mock-llm.provider");
function resolveLlmProviderKind(env = process.env) {
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
function createMockProvider() {
    return new mock_llm_provider_1.MockLlmProvider();
}
//# sourceMappingURL=llm-provider.factory.js.map