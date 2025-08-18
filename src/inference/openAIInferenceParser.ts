import {InferenceParser} from "./inferenceParser";
import {InferredOutput} from "../core/model";

export class OpenAIInferenceParser implements InferenceParser {
    parse(outputText: string): InferredOutput {
        return JSON.parse(outputText);
    }

    static create() {
        return new OpenAIInferenceParser();
    }

}