import {
    FlowInstruction,
    Context,
    FlowStep,
    MediaOutput, FlowExecutionOutput, FlowConfig, NoMediaOutput
} from '../core/model';
import {v1 as uuidv1} from 'uuid';
import {MessageResolver} from "../render/messageResolver";
import {StepRunner} from "./stepRunner";
import {FlowLogger} from "../logging/flowLogger";
import {StepResolver} from "./stepResolver";
import {
    EndCallHandler,
    FlowStepHandler,
    GatherIntentStepHandler,
    MakeCallStepHandler,
    PlayMessageStepHandler, RestCallHandler, SetDataHandler
} from "./flowStepHandler";


export class FlowEngine {

    constructor(private messageResolver: MessageResolver, private stepRunner: StepRunner,
                private logger: FlowLogger) {

    }

    public async execStep(flowConfig: FlowConfig, context: Context, stepName?: string,
                          mediaOutput?: MediaOutput): Promise<FlowExecutionOutput> {


        //Get step
        const step = StepResolver.findStep(flowConfig, stepName);

        //Process step
        const flowStepOutput = mediaOutput ? await this.stepRunner.runStep(
            step, mediaOutput, context) : undefined;

        const updatedContext: Context = flowStepOutput ? {
            ...context,
            [step.name]: flowStepOutput
        } : context;

        if (flowStepOutput) {
            await this.logger.log({
                id: uuidv1(),
                flowStep: step,
                level: 'info',
                event: 'step_output',
                data: flowStepOutput,
                timestamp: new Date().toISOString()
            });
        }

        const foundNextStep = StepResolver.findNextStep(flowConfig, updatedContext, step,
            flowStepOutput);
        const nextStep: FlowStep = foundNextStep ? foundNextStep : (!stepName) ? StepResolver
            .findInitialStep(flowConfig) : {
            name: stepName,
            type: 'endCall'
        }

        //Get step instruction
        const nextFlowInstruction = await this.getFlowInstruction(updatedContext, nextStep);

        await this.logger.log({
            id: uuidv1(),
            flowStep: nextStep,
            level: 'info',
            event: 'next_step',
            data: nextFlowInstruction,
            timestamp: new Date().toISOString()
        });

        const nextStepName = nextStep ? nextStep.name : step.name;

        

        if (['setData', 'restCall'].includes(nextFlowInstruction.type)) {
            const mediaOutput: NoMediaOutput = {
                type: 'noMediaOutput'
            }
            return this.execStep(flowConfig, updatedContext, nextStepName, mediaOutput);
        } else {
            return {
                nextInstruction: nextFlowInstruction,
                nextStepName: nextStepName,
                updatedContext: updatedContext
            };
        }

    }

    private async getFlowInstruction(context: Context, flowStep?: FlowStep): Promise<FlowInstruction> {

        if (!flowStep) {
            return {
                type: 'endCall'
            }
        }

        let handler: FlowStepHandler;

        switch (flowStep.type) {
            case 'gatherIntent':
                handler = new GatherIntentStepHandler(this.messageResolver);
                break;
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
        return new FlowEngine(new MessageResolver(), StepRunner.createOpenAIStepRunner(),
            logger);
    }
}
