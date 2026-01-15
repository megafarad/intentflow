// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {Jexl} from "@pawel-up/jexl";
import {Context, FlowConfig, FlowStep, FlowStepOutput} from "../core/model";

export class StepResolver {

    constructor(private evaluator: Jexl) {

    }

    public findStep(flow: FlowConfig, stepName?: string) {
        const foundStep = stepName ? flow.steps.find(step => step.name === stepName) :
            flow.steps.find(step =>  step.name === flow.initialStepName);

        if (!foundStep) {
            if (stepName) {
                throw new FlowStepNotFoundError(`Flow step with name ${stepName} not found`);
            } else {
                throw new FlowStepNotFoundError(`Flow step with name ${flow.initialStepName} not found`);
            }
        }
        return foundStep;
    }

    public async resolveStep(flow: FlowConfig, context: Context, flowStep: FlowStep, flowStepOutput?: FlowStepOutput) {
        if (flowStepOutput?.type === 'noMediaOutput' && flowStep.type === 'gatherIntent') {
            return flowStep;
        }

        const evaluations = flowStep.outs ? await Promise.all(Object.entries(flowStep.outs).map(async ([port, condition]) => {
            const evaluation = await this.evaluator.evalAsBoolean(condition, context);
            return [port, evaluation] as const;
        })) : [];

        const matchingCondition = evaluations.find(([, evaluation]) => evaluation);

        if (matchingCondition) {
            const outPort = matchingCondition[0];
            const nextStepName = flow.links[flowStep.name + ':' + outPort];
            return flow.steps.find(step => step.name === nextStepName);
        }
        return undefined;
    }

    public async doRepeatStep(flowStep: FlowStep, flowStepOutput: FlowStepOutput, context: Context) {
        if (flowStep.type === 'gatherIntent' && flowStepOutput.type === 'gatherIntent' && flowStep.repeat) {
            try {
                const meetsCondition = await this.evaluator.evalAsBoolean(flowStep.repeat.condition, context);
                const maxAttempts = flowStepOutput.attempt >= flowStep.repeat.attempts;
                return meetsCondition && !maxAttempts;
            } catch (err) {
                console.error(`Error evaluating condition for flow step ${flowStep.name}: ${flowStep.repeat.condition}`);
                throw err;
            }
        } else return false;
    }

    public findInitialStep(flow: FlowConfig) {
        const initialStep = flow.steps.find(step => step.name === flow.initialStepName);
        if (!initialStep) {
            throw new FlowStepNotFoundError(`Flow step with name ${flow.initialStepName} not found`);
        }
        return initialStep;
    }
}

export class NoStepOutputProvidedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoStepOutputProvidedError';
    }
}

export class FlowStepNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FlowStepNotFoundError';
    }
}
