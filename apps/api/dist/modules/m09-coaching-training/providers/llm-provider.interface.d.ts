export type LlmRuntimeMode = 'mock' | 'live';
export interface ILlmProvider {
    readonly name: string;
    getRuntimeMode(): LlmRuntimeMode;
    generateBuyerResponse(systemPrompt: string, history: Array<{
        role: string;
        content: string;
    }>, userMessage: string): Promise<string>;
    evaluateSession(transcript: string, scenarioContext: string): Promise<any>;
    transcribeAudio?(filePath: string): Promise<string>;
}
