import {Context, Message} from "../core/model";
import Jexl from 'jexl';

export class MessageResolver {
    public async resolveMessageText(message: Message, context: Context): Promise<string> {
        const resolvedElements = message.elements.map(element => {
            switch (element.type) {
                case 'tts':
                    return Promise.resolve(element.text);
                case 'dynamic':
                    return Jexl.eval(element.name, context);
                default:
                    return Promise.reject('Unsupported element type');
            }
        });
        return await Promise.all(resolvedElements).then(elements => elements.join(''));
    }
}