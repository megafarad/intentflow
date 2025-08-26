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

export type FlowStepType = 'gatherIntent' | 'makeCall' | 'playMessage' | 'setData' | 'restCall' | 'endCall';

export interface FlowStepBase {
    name: string;
    type: FlowStepType;
    outs?: Record<string, string>;
}

export interface GatherIntentOutputEntity {
    [key: string]: any;
}

export interface GatherIntentOutput {
    type: 'gatherIntent';
    userPrompt: string;
    intent: string;
    attempts: number;
    entity: GatherIntentOutputEntity;
}

export interface CallPromptOutput {
    type: 'callPrompt';
    utterance: string;
    isReprompt: boolean;
}

export interface GatherIntentStep extends FlowStepBase {
    type: 'gatherIntent';
    preamble: string;
    agentPrompt: Message;
    intents: Intent[];
    entityExtractionInstructions?: string;
    additionalInstructions?: string;
    repeat?: {
        condition: string;
        message?: Message;
        attempts: number;
    }
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

export interface NoMediaOutput {
    type: 'noMediaOutput';
}

export interface SetDataStep extends FlowStepBase {
    type: 'setData';
    expressions: Record<string, string>;
}

export interface SuccessfulSetDataOutput {
    type: 'setDataSuccess';
    data: Record<string, any>;
}

export interface FailedSetDataOutput {
    type: 'setDataFailure';
    error: Error;
}

export type SetDataOutput = SuccessfulSetDataOutput | FailedSetDataOutput;

export type PlainHeaderValue = {
    type: 'plain';
    value: string;
};

export type SecretHeaderValue = {
    type: 'secret';
    secretRef: string;
};

export type HeaderValue = PlainHeaderValue | SecretHeaderValue;

export type Headers = Record<string, HeaderValue>;

export interface StaticRestBodyValue {
    type: 'static';
    value: any;
}

export interface DynamicRestBodyValue {
    type: 'dynamic';
    name: string;
}

export type RestBodyValue = StaticRestBodyValue | DynamicRestBodyValue;

export interface RestBody {
    [key: string]: RestBodyValue | RestBody;
}

export interface RestCallStep extends FlowStepBase {
    type: 'restCall';
    url: string;
    headers?: Headers;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: RestBody;
}

export interface RestCallOutput {
    type: 'restCall';
    status: number;
    data: any;
}

export interface EndCallStep extends FlowStepBase {
    type: 'endCall';
}

export type FlowStep = MakeCallStep | GatherIntentStep | PlayMessageStep | SetDataStep | RestCallStep | EndCallStep;

export type MediaOutput = CallPromptOutput | MakeCallOutput | NoMediaOutput;

export type FlowStepOutput = GatherIntentOutput | MakeCallOutput | NoMediaOutput | RestCallOutput | SetDataOutput;

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
}

export interface RestCallInstruction {
    type: 'restCall';
}

export interface PlayInstruction {
    type: 'play';
    play: string;
}

export interface RepeatInstruction {
    type: 'repeat';
    play: string;
}

export type FlowInstruction =
    CallPromptCallInstruction
    | InitiateCallInstruction
    | PlayInstruction
    | RepeatInstruction
    | SetDataInstruction
    | RestCallInstruction
    | EndCallInstruction;

export interface FlowExecutionOutput {
    nextInstruction: FlowInstruction;
    nextStepName: string;
    nextStepType: FlowStepType;
    updatedContext: Context;
}

export interface InferredOutput {
    intent: string;
    entity: Record<string, any>;
}