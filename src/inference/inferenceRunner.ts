import {InferredOutput} from "../core/model";
import {LLM} from "./llm";
import {InferenceParser} from "./inferenceParser";

export class InferenceRunner {
    protected llm: LLM;
    protected parser: InferenceParser;

    protected constructor(llm: LLM, parser: InferenceParser) {
        this.llm = llm;
        this.parser = parser;
    }


    async run(systemPrompt: string, userPrompt: string): Promise<InferredOutput> {
        const llmOutput = await this.llm.generateCompletion(systemPrompt, userPrompt);
        return this.parser.parse(llmOutput);
    }

    static create(llm: LLM, parser: InferenceParser) {
        return new InferenceRunner(llm, parser);
    }
}