import {
    FlowInstruction,
    Context,
    FlowStep,
    MediaOutput, FlowExecutionOutput, FlowConfig, NoMediaOutput
} from '../core/model';
import {v7 as uuidv7} from 'uuid';
import {Jexl} from "@pawel-up/jexl";
import {MessageResolver} from "../render/messageResolver";
import {StepRunner} from "./stepRunner";
import {FlowLogger} from "../logging/flowLogger";
import {StepResolver} from "./stepResolver";
import {
    EndCallHandler,
    FlowStepHandler,
    GatherIntentStepHandler,
    MakeCallStepHandler,
    PlayMessageStepHandler, RepeatGatherIntentStepHandler, RestCallHandler, SetDataHandler
} from "./flowStepHandler";
import {defaultJexlInstance} from "../data/defaultJexlInstance";
import {InferenceRunner} from "../inference/inferenceRunner";
import {SecretsManager, SimpleSecretsManager} from "../secrets/secretsManager";
import {OpenAIInferenceRunner} from "../inference/openAIInferenceRunner";
import {OpenAILLM} from "../inference/openAILLM";
import {OpenAIInferenceParser} from "../inference/openAIInferenceParser";

export class FlowEngine {

    private stepResolver: StepResolver;
    private stepRunner: StepRunner;
    private readonly messageResolver: MessageResolver;

    constructor(private evaluator: Jexl, inferenceRunner: InferenceRunner, secretsManger: SecretsManager) {

        this.stepResolver = new StepResolver(this.evaluator);
        this.messageResolver = new MessageResolver(this.evaluator);
        this.stepRunner = new StepRunner(this.messageResolver, inferenceRunner, secretsManger, this.evaluator);
    }

    public async execStep(tenantId: string, flowConfig: FlowConfig, context: Context, stepName?: string,
                          mediaOutput?: MediaOutput, loggerConfig?: {logger: FlowLogger, logSubscriberId: string}): Promise<FlowExecutionOutput> {


        //Get step
        const step = this.stepResolver.findStep(flowConfig, stepName);

        //Process step
        const flowStepOutput = mediaOutput ? await this.stepRunner.runStep(tenantId,
            step, mediaOutput, context) : undefined;

        const updatedContext: Context = flowStepOutput && flowStepOutput.type !== 'noMediaOutput' ? {
            ...context,
            [step.name]: flowStepOutput
        } : context;

        if (flowStepOutput) {
            await loggerConfig?.logger.log({
                id: uuidv7(),
                logSubscriberId: loggerConfig?.logSubscriberId,
                flowStep: step,
                level: 'info',
                event: 'step_output',
                data: flowStepOutput,
                timestamp: new Date().toISOString()
            });
        }

        const doRepeat = flowStepOutput ? await this.stepResolver.doRepeatStep(step, flowStepOutput, updatedContext) : false;

        const resolvedStep = doRepeat ? step : await this.stepResolver.resolveStep(flowConfig, updatedContext, step,
            flowStepOutput);
        const nextStep: FlowStep | undefined = resolvedStep ? resolvedStep : (!stepName) ? this.stepResolver
            .findInitialStep(flowConfig) : undefined

        //Get step instruction
        const nextFlowInstruction = await this.getFlowInstruction(updatedContext, doRepeat, nextStep);

        await loggerConfig?.logger?.log({
            id: uuidv7(),
            logSubscriberId: loggerConfig?.logSubscriberId,
            flowStep: nextStep,
            level: 'info',
            event: 'next_step',
            data: nextFlowInstruction,
            timestamp: new Date().toISOString()
        });

        const nextStepName = nextStep?.name;
        const nextStepType = nextStep?.type;

        if (nextFlowInstruction?.type && ['setData', 'restCall'].includes(nextFlowInstruction?.type)) {
            const mediaOutput: NoMediaOutput = {
                type: 'noMediaOutput'
            }
            return this.execStep(tenantId, flowConfig, updatedContext, nextStepName,
                mediaOutput, loggerConfig);
        } else {
            return {
                nextInstruction: nextFlowInstruction,
                nextStepName: nextStepName,
                nextStepType: nextStepType,
                updatedContext: updatedContext
            };
        }

    }

    private async getFlowInstruction(context: Context, isRepeat: boolean, flowStep?: FlowStep): Promise<FlowInstruction | undefined> {

        if (!flowStep) {
            return undefined;
        }

        let handler: FlowStepHandler;

        switch (flowStep.type) {
            case 'gatherIntent':
                if (isRepeat) {
                    handler = new RepeatGatherIntentStepHandler(this.messageResolver);
                    break;
                } else {
                    handler = new GatherIntentStepHandler(this.messageResolver);
                    break;
                }
            case 'makeCall':
                handler = new MakeCallStepHandler(this.messageResolver, this.evaluator);
                break;
            case 'playMessage':
                handler = new PlayMessageStepHandler(this.messageResolver);
                break;
            case 'endCall':
                handler = new EndCallHandler();
                break;
            case 'setData':
                handler = new SetDataHandler();
                break;
            case 'restCall':
                handler = new RestCallHandler();
                break;
        }

        return handler.handle(flowStep, context);

    }

    public static create(evaluator: Jexl, inferenceRunner: InferenceRunner, secretsManager: SecretsManager): FlowEngine {
        return new FlowEngine(evaluator, inferenceRunner, secretsManager);
    }

    public static createDemoEngine(): FlowEngine {
        return new FlowEngine(defaultJexlInstance, OpenAIInferenceRunner
            .create(OpenAILLM.create('gpt-4o-mini'), OpenAIInferenceParser.create()), new SimpleSecretsManager());
    }
}
