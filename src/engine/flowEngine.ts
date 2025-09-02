import {
    FlowInstruction,
    Context,
    FlowStep,
    MediaOutput, FlowExecutionOutput, FlowConfig, NoMediaOutput
} from '../core/model';
import {v7 as uuidv7} from 'uuid';
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


export class FlowEngine {

    constructor(private messageResolver: MessageResolver, private stepRunner: StepRunner,
                private logger: FlowLogger) {

    }

    public async execStep(tenantId: string, flowConfig: FlowConfig, context: Context, stepName?: string,
                          mediaOutput?: MediaOutput, logSubscriberId?: string): Promise<FlowExecutionOutput> {


        //Get step
        const step = StepResolver.findStep(flowConfig, stepName);

        //Process step
        const flowStepOutput = mediaOutput ? await this.stepRunner.runStep(tenantId,
            step, mediaOutput, context) : undefined;

        const updatedContext: Context = flowStepOutput && flowStepOutput.type !== 'noMediaOutput' ? {
            ...context,
            [step.name]: flowStepOutput
        } : context;

        if (flowStepOutput) {
            await this.logger.log({
                id: uuidv7(),
                logSubscriberId: logSubscriberId,
                flowStep: step,
                level: 'info',
                event: 'step_output',
                data: flowStepOutput,
                timestamp: new Date().toISOString()
            });
        }

        const doRepeat = flowStepOutput ? await StepResolver.doRepeatStep(step, flowStepOutput, updatedContext) : false;

        const resolvedStep = doRepeat ? step : StepResolver.resolveStep(flowConfig, updatedContext, step,
            flowStepOutput);
        const nextStep: FlowStep = resolvedStep ? resolvedStep : (!stepName) ? StepResolver
            .findInitialStep(flowConfig) : {
            name: stepName,
            type: 'endCall'
        }

        //Get step instruction
        const nextFlowInstruction = await this.getFlowInstruction(updatedContext, doRepeat, nextStep);

        await this.logger.log({
            id: uuidv7(),
            logSubscriberId: logSubscriberId,
            flowStep: nextStep,
            level: 'info',
            event: 'next_step',
            data: nextFlowInstruction,
            timestamp: new Date().toISOString()
        });

        const executionStep = nextStep ? nextStep : step;

        if (['setData', 'restCall'].includes(nextFlowInstruction.type)) {
            const mediaOutput: NoMediaOutput = {
                type: 'noMediaOutput'
            }
            return this.execStep(tenantId, flowConfig, updatedContext, executionStep.name, mediaOutput);
        } else {
            return {
                nextInstruction: nextFlowInstruction,
                nextStepName: executionStep.name,
                nextStepType: executionStep.type,
                updatedContext: updatedContext
            };
        }

    }

    private async getFlowInstruction(context: Context, isRepeat: boolean, flowStep?: FlowStep): Promise<FlowInstruction> {

        if (!flowStep) {
            return {
                type: 'endCall'
            }
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
                handler = new MakeCallStepHandler();
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

    public static create(logger: FlowLogger): FlowEngine {
        return new FlowEngine(new MessageResolver(), StepRunner.createDemoStepRunner(),
            logger);
    }
}
