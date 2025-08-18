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

    public static findNextStep(flow: FlowConfig, context: Context, flowStep: FlowStep, flowStepOutput?: FlowStepOutput) {
        if (!flowStepOutput) {
            if (flowStep.type in ['gatherIntent', 'makeCall']) {
                throw new NoStepOutputProvidedError(`No step output provided for flow step ${flowStep.name}`);
            }
        } else {
            context[flowStep.name] = flowStepOutput;
        }
        const matchingCondition = flowStep.outs ? Object.entries(flowStep.outs)
            .find(([_, condition]) => {
                return Jexl.evalSync(condition, context);
            }) : undefined;

        if (matchingCondition) {
            const outPort = matchingCondition[0];
            const nextStepName = flow.links[flowStep.name + ':' + outPort];
            return flow.steps.find(step => step.name === nextStepName);
        }
        return undefined;
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
