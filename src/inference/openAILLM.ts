// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {LLM} from "./llm";
import {OpenAI as OpenAIApi} from 'openai';

export class OpenAILLM implements LLM {

    private readonly apiKey: string;
    private readonly model: string;

    private readonly openAIApi: OpenAIApi;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
        this.openAIApi = new OpenAIApi({
            apiKey: this.apiKey
        });
    }

    async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
        const response = await this.openAIApi.responses.create({
            model: this.model,
            input: [
                {role: 'system', content: systemPrompt},
                {role: 'user', content: userPrompt}
            ]
        })
        return response.output_text;
    }

    public static create(model: string, apiKey: string): OpenAILLM {
        return new OpenAILLM(apiKey, model);
    }

}
