import {FlowStep} from "../core/model";

export interface LogEntry {
    id: string;
    flowStep?: FlowStep;
    level?: 'info' | 'warn' | 'error';
    message?: string;
    event?: string;
    data?: Record<string, any>;
    timestamp: string;
}

export interface FlowLogger {
    log(entry: LogEntry): Promise<void>;
    flush?(): Promise<void>;
}