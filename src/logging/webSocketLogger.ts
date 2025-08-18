import {FlowInstanceLogger, LogEntry} from "./flowInstanceLogger";

export class WebSocketLogger implements FlowInstanceLogger {
    private clients = new Set<WebSocket>();

    async log(entry: LogEntry): Promise<void> {
        const payloadObj = {type: 'log', entry: entry}
        const payload = JSON.stringify(payloadObj);
        const prettyPayload = JSON.stringify(payloadObj, null, 2);
        console.log(prettyPayload);
        this.clients.forEach(ws => {
            if (ws.readyState === ws.OPEN) {
                ws.send(payload);
            }
        });
    }

    subscribe(client: WebSocket) {
        this.clients.add(client);
    }

    unsubscribe(client: WebSocket) {
        this.clients.delete(client);
    }

}