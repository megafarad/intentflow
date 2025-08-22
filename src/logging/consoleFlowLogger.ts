import {FlowLogger, LogEntry} from './flowLogger';

export class ConsoleFlowLogger implements FlowLogger {
    async log(entry: LogEntry): Promise<void> {
        console.log(JSON.stringify(entry, null, 2));
    }

}