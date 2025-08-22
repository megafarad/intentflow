import {
    MediaOutput,
    CallPromptOutput,
    Context,
    FlowStep,
    FlowStepOutput, GatherIntentOutput,
    GatherIntentStep, SetDataStep, SetDataOutput, RestCallStep, RestCallOutput
} from "../core/model";
import {MessageResolver} from "../render/messageResolver";
import {OpenAILLM} from "../inference/openAILLM";
import {InferenceRunner} from "../inference/inferenceRunner";
import {OpenAIInferenceRunner} from "../inference/openAIInferenceRunner";
import {OpenAIInferenceParser} from "../inference/openAIInferenceParser";
import Jexl from "jexl";
import {DateTime} from "luxon";
import {parseSmartDate} from "../inference/parseSmartDate";
import axios, {AxiosRequestConfig} from 'axios';


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
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'makeCall', but got ${mediaOutput.type} instead.`);
                }
            case 'playMessage':
                if (mediaOutput.type === 'noMediaOutput') {
                    return mediaOutput;
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'noMediaOutput', but got ${mediaOutput.type} instead.`)
                }
            case 'gatherIntent':
                if (mediaOutput.type === 'callPrompt') {
                    return this.processGatherIntentStep(step, mediaOutput, context);
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'callPrompt', but got ${mediaOutput.type} instead.`)
                }
            case 'setData':
                if (mediaOutput.type === 'noMediaOutput') {
                    return this.processSetDataStep(step, context);
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'noMediaOutput', but got ${mediaOutput.type} instead.`)
                }
            case 'restCall':
                if (mediaOutput.type === 'noMediaOutput') {
                    return this.processRestCallStep(step, context);
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'noMediaOutput', but got ${mediaOutput.type} instead.`)
                }
            case 'endCall':
                throw new UnexpectedRunStep(`Unexpected run step of type 'endCall'`);
        }
    }

    private async processGatherIntentStep(step: GatherIntentStep, callPromptOutput: CallPromptOutput,
                                          context: Context): Promise<GatherIntentOutput> {
        const agentPrompt = await this.messageResolver.resolveMessageText(step.agentPrompt, context);
        const systemPrompt = this.buildSystemPrompt(step, agentPrompt);
        const userPrompt = callPromptOutput.utterance;

        const inference = await this.inferenceRunner.run(systemPrompt, userPrompt);

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

    private async processSetDataStep(step: SetDataStep, context: Context): Promise<SetDataOutput> {
        Jexl.addFunction('parseSmartDate', (input: string, anchorDateString: string, timeZone: string) => {
            const anchorDate = DateTime.fromISO(anchorDateString).setZone(timeZone);
            return parseSmartDate(input, anchorDate);
        });

        const evaluatedExpressions = Object.entries(step.expressions).map(async ([key, expression]) => {
            const result = await Jexl.eval(expression, context);
            const tuple: [string, any] = [key, result];
            return tuple;
        });
        try {
            const results = await Promise.all(evaluatedExpressions);
            return {
                type: 'setDataSuccess',
                data: Object.fromEntries(results)
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                type: 'setDataFailure',
                error: error
            }
        }
    }

    private async processRestCallStep(step: RestCallStep, context: Context): Promise<RestCallOutput> {
        const axiosInstance = axios.create({});
        const restCallUrl = await Jexl.eval(step.url, context);
        const restCallHeaders = {
            ...step.headers,
            'Accept': 'application/json',
        }

        const axiosCallOpts: AxiosRequestConfig = {
            url: restCallUrl,
            headers: restCallHeaders,
            method: step.method,
            data: step.body
        }

        const response = await axiosInstance.request(axiosCallOpts);

        return {
            type: 'restCall',
            status: response.status,
            data: response.data
        }
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