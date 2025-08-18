import {
    MediaOutput,
    CallPromptOutput,
    Context,
    FlowStep,
    FlowStepOutput, GatherIntentOutput,
    GatherIntentStep
} from "../core/model";
import {MessageResolver} from "../render/messageResolver";
import {OpenAILLM} from "../inference/openAILLM";
import {InferenceRunner} from "../inference/inferenceRunner";
import {OpenAIInferenceRunner} from "../inference/openAIInferenceRunner";
import {OpenAIInferenceParser} from "../inference/openAIInferenceParser";

export class StepRunner {

    constructor(private messageResolver: MessageResolver, private inferenceRunner: InferenceRunner) {

    }


    public async runStep(step: FlowStep, mediaOutput: MediaOutput,
                         context: Context): Promise<FlowStepOutput> {
        switch (step.type) {
            case 'makeCall':
                if (mediaOutput.type === 'makeCall') {
                    return mediaOutput;
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected call instruction output of type 'makeCall', but got ${mediaOutput.type} instead.`);
                }
            case 'playMessage':
                if (mediaOutput.type === 'sayMessage') {
                    return mediaOutput;
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected call instruction output of type 'sayMessage', but got ${mediaOutput.type} instead.`)
                }
            case 'gatherIntent':
                if (mediaOutput.type === 'callPrompt') {
                    return this.processGatherIntentStep(step, mediaOutput, context)
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected call instruction output of type 'callPrompt', but got ${mediaOutput.type} instead.`)
                }
            case 'endCall':
                throw new UnexpectedRunStep(`Unexpected run step of type 'endCall'`);
        }
    }

    private async processGatherIntentStep(step: GatherIntentStep, callInstructionOutput: CallPromptOutput,
                                          context: Context): Promise<GatherIntentOutput> {
        const agentPrompt = await this.messageResolver.resolveMessageText(step.agentPrompt, context);
        const systemPrompt = this.buildSystemPrompt(step, agentPrompt);
        const userPrompt = callInstructionOutput.utterance;

        const inference = await this.inferenceRunner.run(systemPrompt, userPrompt);

        console.log(systemPrompt);

        return {
            type: 'gatherIntent',
            intent: inference.intent,
            userPrompt: userPrompt,
            entity: inference.entity ?? {}
        }

    }

    private buildSystemPrompt(step: GatherIntentStep, agentPrompt: string) {
        const intentInstructions = step.intents.map(intent => {
            return `- ${intent.name}: ${intent.criteria}`;
        }).join('\n');
        return `${step.preamble}
                    
The system will send a message like this to the user:
                    
"${agentPrompt}"
                    
Determine the intent of the user's message from the following list of intents:'
                    
${intentInstructions}
                   
${step.entityExtractionInstructions ?? ''}
                     
${step.additionalInstructions ?? ''}
                   
Respond in compact JSON only with the following fields:
- intent: one of the ${step.intents.length} intents listed above as a string'
${step.entityExtractionInstructions ? '- entity: the extracted entity as a JSON object' : ''}
                    
Respond with JSON only. Do not include any other text or markdown.
`
    }

    public static createOpenAIStepRunner() {
        return new StepRunner(new MessageResolver(), OpenAIInferenceRunner
            .create(OpenAILLM.create('gpt-4o-mini'), OpenAIInferenceParser.create()))
    }
}

class UnexpectedCallInstructionOutput extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnexpectedCallInstructionOutput';
    }
}

class UnexpectedRunStep extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnexpectedRunStep';
    }
}