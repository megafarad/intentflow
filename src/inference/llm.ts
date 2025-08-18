export interface LLM {
    generateCompletion(systemPrompt: string, userPrompt: string): Promise<string>;
}