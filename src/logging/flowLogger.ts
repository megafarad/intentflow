// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {FlowInstruction, FlowStep, FlowStepOutput} from "../core/model";

export type LogData = Record<string, unknown> | FlowStepOutput | FlowInstruction;

export interface LogEntry {
    id: string;
    logSubscriberId?: string;
    flowStep?: FlowStep;
    level?: 'info' | 'warn' | 'error';
    message?: string;
    event?: string;
    data?: LogData;
    timestamp: string;
}

export interface FlowLogger {
    log(entry: LogEntry): Promise<void>;
}
