// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {FlowLogger, LogEntry} from './flowLogger';

export class ConsoleFlowLogger implements FlowLogger {

    constructor() {

    }

    log(entry: LogEntry): Promise<void> {
        console.log(JSON.stringify(entry, null, 2));
        return Promise.resolve();
    }

    static create(): FlowLogger {
        return new ConsoleFlowLogger();
    }

}
