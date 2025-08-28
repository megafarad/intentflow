import {StepRunner} from "../src/engine/stepRunner";
import {SetDataStep} from "../src";

describe('SetDataStep', () => {
    it('should set data with a parseSmartDate call', async () => {
        const stepRunner = StepRunner.createDemoStepRunner();
        const step: SetDataStep = {
            type: 'setData',
            name: 'setData',
            expressions: {
                'parsedDateWithBias': 'parseSmartDate("next week at two", "2025-08-01", true)',
                'parsedDateWithoutBias': 'parseSmartDate("next week at two", "2025-08-01", false)'
            }
        }
        const stepOutput = await stepRunner.runStep('1', step, {type: 'noMediaOutput'}, {});
        if (stepOutput.type === 'setDataSuccess') {
            expect(stepOutput.data.parsedDateWithBias).toEqual({
                fromDate: '2025-08-03',
                toDate: '2025-08-10',
                time: '14:00'
            });
            expect(stepOutput.data.parsedDateWithoutBias).toEqual({
                fromDate: '2025-08-03',
                toDate: '2025-08-10',
                time: '02:00'
            });
        } else {
            throw new Error('Unexpected step output');
        }
    });

    it('should process undefined variable', async () => {
        const stepRunner = StepRunner.createDemoStepRunner();
        const step: SetDataStep = {
            type: 'setData',
            name: 'setData',
            expressions: {
                'isUndefined': 'inputRecord.appointmentDate == undefined ? "true" : "false"',
                'returnUndefined': 'undefined'
            }
        }
        const stepOutput = await stepRunner.runStep('1', step, {type: 'noMediaOutput'}, {
            inputRecord: {
                appointmentDate: undefined
            }
        });
        if (stepOutput.type === 'setDataSuccess') {
            expect(stepOutput.data.isUndefined).toBe("true");
            expect(stepOutput.data.returnUndefined).toBe(undefined);
        } else {
            throw new Error('Unexpected step output');
        }
    });

    it('should process getSpokenDate call', async () => {
        const stepRunner = StepRunner.createDemoStepRunner();
        const step: SetDataStep = {
            type: 'setData',
            name: 'setData',
            expressions: {
                'spokenDate': 'getSpokenDate(inputRecord.appointmentDate)'
            }
        }
        const stepOutput = await stepRunner.runStep('1', step, {type: 'noMediaOutput'}, {
            inputRecord: {
                appointmentDate: '2025-08-08'
            }
        });
        if (stepOutput.type === 'setDataSuccess') {
            expect(stepOutput.data.spokenDate).toBe('Friday, August 8, 2025');
        } else {
            throw new Error('Unexpected step output');
        }
    });

    it('should process getSpokenTime call', async () => {
        const stepRunner = StepRunner.createDemoStepRunner();
        const step: SetDataStep = {
            type: 'setData',
            name: 'setData',
            expressions: {
                'spokenTime': 'getSpokenTime(inputRecord.appointmentTime)'
            }
        }
        const stepOutput = await stepRunner.runStep('1', step, {type: 'noMediaOutput'}, {
            inputRecord: {
                appointmentTime: '10:00'
            }
        });
        if (stepOutput.type === 'setDataSuccess') {
            expect(stepOutput.data.spokenTime).toBe('10:00 AM');
        } else {
            throw new Error('Unexpected step output');
        }
    });
});