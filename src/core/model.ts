// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington

export type SayAs = 'date' | 'time' | 'number' | 'text' | 'digits';

export type ContextValue = FlowStepOutput | Record<string, unknown>;
export type Context = Record<string, ContextValue>;

export interface DynamicElement {
    type: 'dynamic';
    sayAs: SayAs;
    format?: string;
    expression: string;
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
    [key: string]: unknown;
}

export interface GatherIntentOutput {
    type: 'gatherIntent';
    userPrompt: string;
    intent: string;
    attempt: number;
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
    callAnnouncement: Message;
    leaveAMCondition: string;
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
    data: Record<string, unknown>;
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
    value: unknown;
}

export interface DynamicRestBodyValue {
    type: 'dynamic';
    expression: string;
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
    data: unknown;
    error?: Error;
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
    prompt: string;
}

export interface InitiateCallInstruction {
    type: 'initiateCall';
    to: string;
    from: string;
    timeout: number;
    callAnnouncement: string;
    amHandling: 'hangup' | 'leave_message'
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

export interface RepeatPromptInstruction {
    type: 'repeat';
    errorMessage?: string;
    prompt: string;
}

export type FlowInstruction =
    CallPromptCallInstruction
    | InitiateCallInstruction
    | PlayInstruction
    | RepeatPromptInstruction
    | SetDataInstruction
    | RestCallInstruction
    | EndCallInstruction;

export interface FlowExecutionOutput {
    nextInstruction?: FlowInstruction;
    nextStepName?: string;
    nextStepType?: FlowStepType;
    updatedContext: Context;
}

export interface InferredOutput {
    intent: string;
    entity?: Record<string, unknown>;
}
