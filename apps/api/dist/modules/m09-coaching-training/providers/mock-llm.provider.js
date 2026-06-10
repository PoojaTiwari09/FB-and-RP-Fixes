"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLlmProvider = void 0;
class MockLlmProvider {
    name = 'mock';
    getRuntimeMode() {
        return 'mock';
    }
    async generateBuyerResponse(_systemPrompt, history, userMessage) {
        const turnNumber = Math.floor(history.length / 2) + 1;
        const normalized = userMessage.trim() || 'your proposal';
        if (turnNumber === 1) {
            return `I hear you, but I need a clearer reason to change right now. How would ${normalized} improve ROI?`;
        }
        return `That helps, but I am not fully convinced yet. Show me one concrete business outcome.`;
    }
    async evaluateSession(_transcript, _scenarioContext) {
        return {
            scores: { opening: 14, discovery: 15, objection_handling: 16, talk_ratio: 13, closing: 12 },
            overall_score: 70,
            evaluation_summary: 'Mock evaluation completed successfully.',
            strengths: ['Structured response'],
            improvements: ['Ask one more discovery question'],
        };
    }
}
exports.MockLlmProvider = MockLlmProvider;
//# sourceMappingURL=mock-llm.provider.js.map