// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {InferenceParser} from "./inferenceParser";
import {InferredOutput} from "../core/model";
import {OpenAIInferenceSchema} from "../schemas/openAIInferenceSchema";

export class OpenAIInferenceParser implements InferenceParser {
    parse(outputText: string): InferredOutput {
        const rawInferredOutput: unknown = JSON.parse(outputText);
        const validationResult = OpenAIInferenceSchema.safeParse(rawInferredOutput);
        if (!validationResult.success) {
            throw new Error(`Failed to parse OpenAI inference output: ${validationResult.error.message}`);
        }
        return validationResult.data;
    }

    static create() {
        return new OpenAIInferenceParser();
    }

}
