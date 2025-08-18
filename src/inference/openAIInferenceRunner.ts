import {InferenceRunner} from "./inferenceRunner";
import {OpenAILLM} from "./openAILLM";
import {OpenAIInferenceParser} from "./openAIInferenceParser";

export class OpenAIInferenceRunner extends InferenceRunner {

    static create(llm: OpenAILLM, parser: OpenAIInferenceParser): InferenceRunner {
        return super.create(llm, parser);
    }

}