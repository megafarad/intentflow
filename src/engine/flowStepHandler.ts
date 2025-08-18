import {Context, FlowInstruction, FlowStep, GatherIntentStep, MakeCallStep, PlayMessageStep} from "../core/model";
import {MessageResolver} from "../render/messageResolver";
import Jexl from "jexl";

/**
 * Interface representing a handler for a step within a flow.
 *
 * This interface is intended to process a specific step in a flow,
 * using the given context, and return an appropriate flow instruction
 * for the next operation.
 *
 * @interface FlowStepHandler
 */
export interface FlowStepHandler {
    handle(flowStep: FlowStep, context: Context): Promise<FlowInstruction>;
}

/**
 * Class responsible for handling the "Gather Intent" step in a conversational flow.
 * This step is designed to prompt the user for input or intent through a render.
 */
export class GatherIntentStepHandler implements FlowStepHandler {
    constructor(private messageResolver: MessageResolver) {

    }

    public async handle(flowStep: GatherIntentStep, context: Context): Promise<FlowInstruction> {
        //TODO: SSML & Audio Files
        const messageText = await this.messageResolver.resolveMessageText(flowStep.agentPrompt, context);
        return {
            type: 'callPrompt',
            play: messageText
        }
    }

}

export class MakeCallStepHandler implements FlowStepHandler {
    constructor() {

    }

    public async handle(flowStep: MakeCallStep, context: Context): Promise<FlowInstruction> {
        const resolvedTo = await Jexl.eval(flowStep.to, context);
        const resolvedFrom = await Jexl.eval(flowStep.from, context);
        return {
            type: 'initiateCall',
            to: resolvedTo,
            from: resolvedFrom,
            timeout: flowStep.timeout
        }
    }
}

export class PlayMessageStepHandler implements FlowStepHandler {
    constructor(private messageResolver: MessageResolver) {

    }

    public async handle(flowStep: PlayMessageStep, context: Context): Promise<FlowInstruction> {
        //TODO: SSML & Audio Files
        const messageText = await this.messageResolver.resolveMessageText(flowStep.message, context);
        return {
            type: 'play',
            play: messageText
        }
    }
}

export class EndCallHandler implements FlowStepHandler {
    constructor() {

    }
    public async handle(): Promise<FlowInstruction> {
        return {
            type: 'endCall'
        }
    }
}