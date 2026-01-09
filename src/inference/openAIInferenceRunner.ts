// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {InferenceRunner} from "./inferenceRunner";
import {OpenAILLM} from "./openAILLM";
import {OpenAIInferenceParser} from "./openAIInferenceParser";

export class OpenAIInferenceRunner extends InferenceRunner {

    static create(llm: OpenAILLM, parser: OpenAIInferenceParser): InferenceRunner {
        return super.create(llm, parser);
    }

}
