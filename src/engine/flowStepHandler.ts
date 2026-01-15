// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {Jexl} from "@pawel-up/jexl";
import {
    Context,
    FlowInstruction,
    FlowStep,
    GatherIntentStep,
    MakeCallStep,
    PlayMessageStep
} from "../core/model";
import {MessageResolver} from "../render/messageResolver";

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
            prompt: messageText
        }
    }

}

export class RepeatGatherIntentStepHandler implements FlowStepHandler {
    constructor(private messageResolver: MessageResolver) {

    }

    public async handle(flowStep: GatherIntentStep, context: Context): Promise<FlowInstruction> {
        //TODO: SSML & Audio Files
        const errorMessage = flowStep.repeat?.message ? await this.messageResolver.resolveMessageText(flowStep.repeat.message, context) : undefined;
        const prompt = await this.messageResolver.resolveMessageText(flowStep.agentPrompt, context);

        return {
            type: 'repeat',
            errorMessage: errorMessage,
            prompt: prompt,
        }
    }
}

export class MakeCallStepHandler implements FlowStepHandler {
    constructor(private messageResolver: MessageResolver, private evaluator: Jexl) {

    }

    public async handle(flowStep: MakeCallStep, context: Context): Promise<FlowInstruction> {
        const resolvedTo = await this.evaluator.evalAsString(flowStep.to, context);
        const resolvedFrom = await this.evaluator.evalAsString(flowStep.from, context);
        const resolvedCallAnnouncement = await this.messageResolver.resolveMessageText(flowStep.callAnnouncement, context);
        const leaveAM = await this.evaluator.evalAsBoolean(flowStep.leaveAMCondition, context);
        return {
            type: 'initiateCall',
            to: resolvedTo,
            from: resolvedFrom,
            timeout: flowStep.timeout,
            callAnnouncement: resolvedCallAnnouncement,
            amHandling: leaveAM ? 'leave_message' : 'hangup'
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

export class SetDataHandler implements FlowStepHandler {
    constructor() {

    }

    public handle(): Promise<FlowInstruction> {
        return Promise.resolve({
            type: 'setData',
        });
    }

}

export class RestCallHandler implements FlowStepHandler {

    constructor() {

    }

    public handle(): Promise<FlowInstruction> {
        return Promise.resolve({
            type: 'restCall'
        });
    }

}

export class EndCallHandler implements FlowStepHandler {
    constructor() {

    }
    public handle(): Promise<FlowInstruction> {
        return Promise.resolve({
            type: 'endCall'
        });
    }
}
