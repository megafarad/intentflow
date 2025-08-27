import {
    MediaOutput,
    CallPromptOutput,
    Context,
    FlowStep,
    FlowStepOutput, GatherIntentOutput,
    GatherIntentStep, SetDataStep, SetDataOutput, RestCallStep, RestCallOutput, Headers, RestBody
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
import {SecretsManager, SimpleSecretsManager} from "../secrets/secretsManager";


export class StepRunner {

    constructor(private messageResolver: MessageResolver, private inferenceRunner: InferenceRunner,
                private secretsManager: SecretsManager) {

    }


    public async runStep(tenantId: string, step: FlowStep, mediaOutput: MediaOutput,
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
                } else if (mediaOutput.type === 'noMediaOutput') {
                    return mediaOutput;
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'callPrompt' or 'noMediaOutput', but got ${mediaOutput.type} instead.`)
                }
            case 'setData':
                if (mediaOutput.type === 'noMediaOutput') {
                    return this.processSetDataStep(step, context);
                } else {
                    throw new UnexpectedCallInstructionOutput(`Expected media output of type 'noMediaOutput', but got ${mediaOutput.type} instead.`)
                }
            case 'restCall':
                if (mediaOutput.type === 'noMediaOutput') {
                    try {
                        return this.processRestCallStep(tenantId, step, context);
                    } catch (e) {
                        if (e instanceof Error) {
                            return {
                                type: 'restCall',
                                status: 500,
                                data: {
                                    error: 'Internal Server Error'
                                },
                                error: e
                            }
                        } else {
                            return {
                                type: 'restCall',
                                status: 500,
                                data: {
                                    error: 'Internal Server Error'
                                },
                                error: new Error('Unknown error')
                            }
                        }
                    }

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

        const currentContext = context[step.name];
        const recordedAttempts = currentContext && currentContext.attempts ? Number(currentContext.attempts) : 0;
        const currentAttempt = callPromptOutput.isReprompt ? recordedAttempts + 1 : 1;


        const inference = await this.inferenceRunner.run(systemPrompt, userPrompt);

        return {
            type: 'gatherIntent',
            intent: inference.intent,
            userPrompt: userPrompt,
            entity: inference.entity ?? {},
            attempts: currentAttempt
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

    public static createDemoStepRunner() {
        return new StepRunner(new MessageResolver(), OpenAIInferenceRunner
            .create(OpenAILLM.create('gpt-4o-mini'), OpenAIInferenceParser.create()), new SimpleSecretsManager())
    }

    private async processSetDataStep(step: SetDataStep, context: Context): Promise<SetDataOutput> {
        Jexl.addFunction('parseSmartDate', (input: string, anchorDateString: string, timeZone: string, businessHourBias?: boolean) => {
            const anchorDate = DateTime.fromISO(anchorDateString).setZone(timeZone);
            return parseSmartDate(input, anchorDate, businessHourBias);
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

    private async processRestCallStep(tenantId: string, step: RestCallStep, context: Context): Promise<RestCallOutput> {
        const axiosInstance = axios.create({});
        const restCallUrl = await Jexl.eval(step.url, context);
        const resolvedBody =  step.body ? this.resolveRestCallBody(step.body, context) : undefined;
        const stepHeaders = await this.resolveRestCallHeaders(tenantId, step.headers);
        const restCallHeaders = {
            ...stepHeaders,
            'Accept': 'application/json',
        }

        const axiosCallOpts: AxiosRequestConfig = {
            url: restCallUrl,
            headers: restCallHeaders,
            method: step.method,
            data: resolvedBody,
            validateStatus: () => true
        }

        const response = await axiosInstance.request(axiosCallOpts);

        return {
            type: 'restCall',
            status: response.status,
            data: response.data,
        }
    }

    private async resolveRestCallHeaders(tenantId: string, headers?: Headers) {
        if (headers) {
            const resolvedHeadersPromises = Object.entries(headers).map(async ([key, value]) => {
                switch (value.type) {
                    case 'plain':
                        const plainTuple: [string, string] = [key, value.value];
                        return plainTuple;
                    case 'secret':
                        const resolvedSecret = await this.secretsManager.getSecret(tenantId, value.secretRef);
                        const secretTuple: [string, string] = [key, resolvedSecret];
                        return secretTuple;

                }
            });
            const resolvedHeaders = await Promise.all(resolvedHeadersPromises);
            return Object.fromEntries(resolvedHeaders);
        }
        return undefined;
    }

    private resolveRestCallBody(body: RestBody, context: Context): { [p: string]: any } {
        const entries: ([string, any])[] = Object.entries(body).map(([key, value]) => {
            if (value.type === 'static') {
                const tuple: [string, any] = [key, value.value];
                return tuple;
            } else if (value.type === 'dynamic') {
                const tuple: [string, any] = [key, Jexl.evalSync(value.name, context)];
                return tuple;
            } else {
                const tuple: [string, any] = [key, this.resolveRestCallBody(value, context)];
                return tuple;
            }
        });
        return Object.fromEntries(entries);
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