import {InferredOutput} from "../core/model";

export interface InferenceParser {
    parse(outputText: string): InferredOutput;
}
