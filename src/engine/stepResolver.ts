import {Context, FlowConfig, FlowStep, FlowStepOutput} from "../core/model";
import Jexl from "jexl";

export class StepResolver {

    public static findStep(flow: FlowConfig, stepName?: string) {
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

    public static resolveStep(flow: FlowConfig, context: Context, flowStep: FlowStep, flowStepOutput?: FlowStepOutput) {
        if (flowStepOutput?.type === 'noMediaOutput' && flowStep.type === 'gatherIntent') {
            return flowStep;
        }
        const matchingCondition = flowStep.outs ? Object.entries(flowStep.outs)
            .find(([_, condition]) => {
                try {
                    return Boolean(Jexl.evalSync(condition, context));
                } catch (err) {
                    console.error(`Error evaluating condition for flow step ${flowStep.name}: ${condition}`);
                    throw err;
                }

            }) : undefined;

        if (matchingCondition) {
            const outPort = matchingCondition[0];
            const nextStepName = flow.links[flowStep.name + ':' + outPort];
            return flow.steps.find(step => step.name === nextStepName);
        }
        return undefined;
    }

    public static async doRepeatStep(flowStep: FlowStep, flowStepOutput: FlowStepOutput, context: Context) {
        if (flowStep.type === 'gatherIntent' && flowStepOutput.type === 'gatherIntent' && flowStep.repeat) {
            try {
                const evaluation = await Jexl.eval(flowStep.repeat.condition, context);
                const meetsCondition = Boolean(evaluation);
                const maxAttempts = flowStepOutput.attempts >= flowStep.repeat.attempts;
                return meetsCondition && !maxAttempts;
            } catch (err) {
                console.error(`Error evaluating condition for flow step ${flowStep.name}: ${flowStep.repeat.condition}`);
                throw err;
            }
        } else return false;
    }

    public static findInitialStep(flow: FlowConfig) {
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
