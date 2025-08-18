export type SayAs = 'date' | 'time' | 'number' | 'text' | 'digits';

export type Context = Record<string, Record<string, any>>;

export interface DynamicElement {
    type: 'dynamic';
    sayAs: SayAs;
    format?: string;
    name: string;
}

export interface TTSElement {
    type: 'tts';
    text: string;
}

export type MessageElement = DynamicElement | TTSElement;

export interface Message {
    elements: MessageElement[];
}

export interface Intent {
    name: string;
    criteria: string;
}

export interface FlowStepBase {
    name: string;
    type: string;
    outs?: Record<string, string>;
}
export interface GatherIntentOutputEntity {
    [key: string]: any;
}

export interface GatherIntentOutput {
    type: 'gatherIntent';
    userPrompt: string;
    intent: string;
    entity: GatherIntentOutputEntity;
}

export interface CallPromptOutput {
    type: 'callPrompt';
    utterance: string;
}

export interface GatherIntentStep extends FlowStepBase {
    type: 'gatherIntent';
    preamble: string;
    agentPrompt: Message;
    intents: Intent[];
    entityExtractionInstructions?: string;
    additionalInstructions?: string;
}

export interface MakeCallStep extends FlowStepBase {
    type: 'makeCall';
    from: string;
    to: string;
    timeout: number;
}

export interface MakeCallOutput {
    type: 'makeCall';
    result: string;
}

export interface PlayMessageStep extends FlowStepBase {
    type: 'playMessage';
    message: Message;
}

export interface SayMessageOutput {
    type: 'sayMessage';
}

export interface EndCallStep extends FlowStepBase {
    type: 'endCall';
}

export type FlowStep = MakeCallStep | GatherIntentStep | PlayMessageStep | EndCallStep;

export type MediaOutput = CallPromptOutput | MakeCallOutput | SayMessageOutput;

export type FlowStepOutput = GatherIntentOutput | MakeCallOutput | SayMessageOutput;

export interface FlowConfig {
    id: string;
    name: string;
    initialStepName: string;
    steps: FlowStep[];
    links: Record<string, string>;
}
export interface CallPromptCallInstruction {
    type: 'callPrompt';
    play: string;
}

export interface InitiateCallInstruction {
    type: 'initiateCall';
    to: string;
    from: string;
    timeout: number;
}

export interface EndCallInstruction {
    type: 'endCall';
}

export interface SetDataInstruction {
    type: 'setData';
    data: Record<string, any>;
}

export interface PlayInstruction {
    type: 'play';
    play: string;
}

export type FlowInstruction = CallPromptCallInstruction | InitiateCallInstruction | PlayInstruction |
    EndCallInstruction;

export interface FlowExecutionOutput {
    nextInstruction: FlowInstruction;
    nextStepName: string;
    updatedContext: Context;
}

export interface InferredOutput {
    intent: string;
    entity: Record<string, any>;
}