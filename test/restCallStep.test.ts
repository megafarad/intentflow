import {RestCallStep, Context, MediaOutput} from "../src";
import {StepRunner} from "../src/engine/stepRunner";
import {defaultJexlInstance} from "../src/data/defaultJexlInstance";
import {MessageResolver} from "../src/render/messageResolver";

const step: RestCallStep = {
    name: "exampleRestCall",
    type: "restCall",
    url: '"https://jsonplaceholder.typicode.com/todos/" + inputRecord.todoId',
    method: "GET"
}

describe('restCallStep', () => {

    const evaluator = defaultJexlInstance;
    const messageResolver = new MessageResolver(evaluator);
    const stepRunner = StepRunner.createDemoStepRunner(messageResolver, evaluator);

    it('should make a rest call', async () => {
        const context: Context = {
            'inputRecord': {
                'todoId': 1
            }
        };
        const noMediaOutput: MediaOutput = {
            type: 'noMediaOutput'
        }
        const stepOutput = await stepRunner.runStep('1', step, noMediaOutput, context);
        if (stepOutput.type === 'restCall') {
            expect(stepOutput.status).toBe(200);
            expect(stepOutput.data.title).toBe('delectus aut autem');
        } else {
            throw new Error('Unexpected step output');
        }
    })
});
