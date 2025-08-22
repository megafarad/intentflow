import {RestCallStep, Context, MediaOutput} from "../src";
import {StepRunner} from "../src/engine/stepRunner";

const step: RestCallStep = {
    name: "exampleRestCall",
    type: "restCall",
    url: '"https://jsonplaceholder.typicode.com/todos/" + inputRecord.todoId',
    method: "GET"
}

describe('restCallStep', () => {
    it('should make a rest call', async () => {
        const stepRunner = StepRunner.createOpenAIStepRunner();
        const context: Context = {
            'inputRecord': {
                'todoId': 1
            }
        };
        const noMediaOutput: MediaOutput = {
            type: 'noMediaOutput'
        }
        const stepOutput = await stepRunner.runStep(step, noMediaOutput, context);
        if (stepOutput.type === 'restCall') {
            expect(stepOutput.status).toBe(200);
            expect(stepOutput.data.title).toBe('delectus aut autem');
        } else {
            throw new Error('Unexpected step output');
        }
    })
});