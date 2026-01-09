// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {Context, Message} from "../core/model";
import {Jexl} from "@pawel-up/jexl";

export class MessageResolver {

    constructor(private evaluator: Jexl) {

    }

    public async resolveMessageText(message: Message, context: Context): Promise<string> {
        const resolvedElements = message.elements.map(element => {
            switch (element.type) {
                case 'tts':
                    return Promise.resolve(element.text);
                case 'dynamic':
                    return this.evaluator.eval(element.expression, context);
                default:
                    return Promise.reject(new Error('Unsupported element type'));
            }
        });
        return await Promise.all(resolvedElements).then(elements => elements.join(''));
    }

    public static create(evaluator: Jexl): MessageResolver {
        return new MessageResolver(evaluator);
    }
}
