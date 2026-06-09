import { ILlmProvider, LlmRuntimeMode } from './llm-provider.interface';
export declare class MockLlmProvider implements ILlmProvider {
    readonly name = "mock";
    getRuntimeMode(): LlmRuntimeMode;
    generateBuyerResponse(_systemPrompt: string, history: Array<{
        role: string;
        content: string;
    }>, userMessage: string): Promise<string>;
    evaluateSession(_transcript: string, _scenarioContext: string): Promise<any>;
}
