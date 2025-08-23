import {FlowLogger, LogEntry} from './flowLogger';

export class ConsoleFlowLogger implements FlowLogger {

    constructor() {

    }

    async log(entry: LogEntry): Promise<void> {
        console.log(JSON.stringify(entry, null, 2));
    }

    static create(): FlowLogger {
        return new ConsoleFlowLogger();
    }

}