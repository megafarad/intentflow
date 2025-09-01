import {
    CallPromptOutput,
    FlowConfig,
    MakeCallOutput,
    Context,
    FlowEngine,
    NoMediaOutput
} from "../src";
import {ConsoleFlowLogger} from "../src";

const exampleFlowConfig: FlowConfig = {
    id: 'exampleFlowTest',
    name: 'HealthcareAppointmentReminderCall',
    initialStepName: 'makeCall',
    steps: [
        {
            type: 'makeCall',
            name: 'makeCall',
            to: '"+1" + inputRecord.phoneNumber',
            from: '"+18445680751"',
            timeout: 30,
            outs: {
                'liveAnswer': 'makeCall.result == "LA"',
                'answeringMachine': 'makeCall.result == "AM"',
                'noAnswer': 'makeCall.result == "NA"',
                'busy': 'makeCall.result == "B"',
                'deliveryFailure': 'makeCall.result == "DF"',
                'faxTone': 'makeCall.result == "FT"',
                'invalidAddress': 'makeCall.result == "IA"',
            }
        },
        {
            type: 'gatherIntent',
            name: 'rightPartyIdentification',
            preamble: 'You are an intent parser, parsing the intent during the recipient identification step of ' +
                'a telephone call.',
            agentPrompt: {
                elements: [
                    {type: 'tts', text: 'This is '},
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.clinicName'},
                    {type: 'tts',  text: ' calling with an important message. Is this '},
                    {type: 'dynamic', sayAs: 'text',  expression: 'inputRecord.firstName'},
                    {type: 'tts', text: ' '},
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.lastName'},
                    {type: 'tts', text: '?'}
                ]
            },
            intents: [
                {name: 'rightParty', criteria: 'Use this intent if the user identifies themselves as the right party.'},
                {name: 'otherParty', criteria: 'Use this intent if the user indicates that they are not the right party.'},
                {name: 'wrongHousehold', criteria: 'Use this intent if the user indicates that we have reached ' +
                        'the wrong number/household.'},
                {name: 'leaveMessage', criteria: 'Use this intent if the user offers to take a render for the ' +
                        'right party.'},
                {name: 'other', criteria: 'Use this intent if the user says something else.'}
            ],
            outs: {
                'rightParty': 'rightPartyIdentification.intent == "rightParty"',
                'otherParty': 'rightPartyIdentification.intent == "otherParty"',
                'wrongHousehold': 'rightPartyIdentification.intent == "wrongHousehold"',
                'leaveMessage': 'rightPartyIdentification.intent == "leaveMessage"',
                'other': 'rightPartyIdentification.intent == "other"'
            }
        },
        {
            type: 'gatherIntent',
            name: 'authentication',
            preamble: 'You are an intent parser, parsing the intent during the authentication stage of a phone call.',
            agentPrompt: {
                elements: [
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.clinicName'},
                    {type: 'tts', text: ' cares about your privacy. To verify your identity, please say your date of ' +
                            'birth.'}
                ]
            },
            intents: [
                {name: 'authenticated', criteria: 'Use this intent if the user says their date of birth.'},
                {name: 'otherParty', criteria: 'Use this intent if the user says they are not the right party.'},
                {name: 'wrongHousehold', criteria: 'Use this intent if the user indicates that we have reached the ' +
                        'wrong household.'},
                {name: 'leaveMessage', criteria: 'Use this intent if the user offers to take a render for the right ' +
                        'party.'},
                {name: 'other', criteria: 'Use this intent if the user says something else.'}
            ],
            entityExtractionInstructions: 'If the user says their date of birth, extract the date of birth as a JSON ' +
                'object, with the field "dateOfBirth" as a string in ISO-8601 format. The user may say their date of ' +
                'birth as digits, like "oh eight oh one nineteen seventy seven" for 1977-08-01.',
            outs: {
                'authenticated': 'authentication.intent == "authenticated" && authentication.entity.dateOfBirth == ' +
                    'inputRecord.dateOfBirth',
                'authenticateFailed': 'authentication.intent == "authenticate" && authentication.entity.dateOfBirth != ' +
                'inputRecord.dateOfBirth',
                'otherParty': 'authentication.intent == "otherParty"',
                'wrongHousehold': 'authentication.intent == "wrongHousehold"',
                'leaveMessage': 'authentication.intent == "leaveMessage"',
                'other': 'authentication.intent == "other"'
            }
        },
        {
            name: "gatherMainIntent",
            type: "gatherIntent",
            preamble: "You are an intent parser, parsing the intent during the appointment reminder step of a phone " +
                "call.",
            agentPrompt: {
                elements: [
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.clinicName'},
                    {type: 'tts', text: ' is calling to remind you of an appointment with '},
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.practitioner'},
                    {type: 'tts', text: ' on '},
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.appointmentDate'},
                    {type: 'tts', text: ' at '},
                    {type: 'dynamic', sayAs: 'text', expression: 'inputRecord.appointmentTime'},
                    {type: 'tts', text: '. Will you be able to make your appointment?'}
                ]
            },
            intents: [
                {name: "confirmAppointment", criteria: "User indicates that they can make the appointment."},
                {name: "cancelAppointment", criteria: "User indicates that they would like to cancel the appointment."},
                {
                    name: "unableToMakeAppointment", criteria: "User indicates that they are unable to make the " +
                        "appointment, and DOES NOT propose an alternative date and/or time for the appointment."
                },
                {
                    name: "rescheduleAppointment", criteria: "User indicates that they would like to reschedule the" +
                        " appointment."
                },
                {
                    name: "proposeAppointment", criteria: "User proposes an alternative date and/or time for the" +
                        " appointment."
                },
                {name: "other", criteria: "User says something else."}
            ],
            entityExtractionInstructions: "The user may indicate an alternative date and/or time for the appointment." +
                "The user may also indicate a range of dates and/or times for the appointment. " +
                "If the user indicates an alternative date and/or time for the appointment, or range of dates " +
                "and/or times for the appointment, extract the proposal as a JSON object, with the field " +
                "\"proposal\". DO NOT calculate the date. Just extract the proposal."
            ,
            additionalInstructions: "Again, DO NOT assign the intent as \"unableToMakeAppointment\" if the user " +
                "proposes an alternative date and/or time for the appointment. Instead, assign the intent as " +
                "\"proposeAppointment\".",
            repeat: {
                condition: 'gatherMainIntent.intent == "other"',
                message: {
                    elements: [
                        {
                            type: "tts",
                            text: "I'm sorry, I did not understand your response."
                        }
                    ]
                },
                attempts: 3
            },
            outs: {
                'confirmAppointment': 'gatherMainIntent.intent == "confirmAppointment"',
                'cancelAppointment': 'gatherMainIntent.intent == "cancelAppointment"',
                'unableToMakeAppointment': 'gatherMainIntent.intent == "unableToMakeAppointment"',
                'rescheduleAppointment': 'gatherMainIntent.intent == "rescheduleAppointment"',
                'proposeAppointment': 'gatherMainIntent.intent == "proposeAppointment"',
                'other': 'gatherMainIntent.intent == "other"'
            }
        },
        {
            name: 'getDateProposal',
            type: 'setData',
            expressions: {
                'dateProposal': 'parseSmartDate(gatherMainIntent.entity.proposal, inputRecord.appointmentDate, "America/New_York")'
            },
            outs: {
                'setDataSuccess': 'getDateProposal.type == "setDataSuccess"',
                'setDataFailure': 'getDateProposal.type == "setDataFailure"'
            }
        }
    ],
    links: {
        'makeCall:liveAnswer': 'rightPartyIdentification',
        'rightPartyIdentification:rightParty': 'authentication',
        'authentication:authenticated': 'gatherMainIntent',
        'gatherMainIntent:proposeAppointment': 'getDateProposal',
    }
}

describe('FlowEngine', () => {
    it('should properly run a flow', async () => {
        const logger = new ConsoleFlowLogger();
        const flowEngine = FlowEngine.create(logger);
        const tenantId = '1';

        const inputRecord: Record<string, any> = {
            clinicName: 'Sunshine Medical',
            firstName: 'Chris',
            lastName: 'Carrington',
            phoneNumber: '2065551234',
            dateOfBirth: '1977-08-01',
            appointmentDate: '2025-08-08',
            appointmentTime: '10:00',
            practitioner: 'John Doe',
        }

        const initialContext: Context = {
            'inputRecord': inputRecord
        }

        const firstFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig, initialContext);

        if (firstFlowExecutionOutput.nextInstruction.type === 'initiateCall') {
            expect(firstFlowExecutionOutput.nextInstruction.to).toBe('+12065551234');
        } else {
            throw new Error('Unexpected flow instruction');
        }

        const firstStepOutput: MakeCallOutput = {
            type: 'makeCall',
            result: 'LA'
        }

        const secondFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            firstFlowExecutionOutput.updatedContext, firstFlowExecutionOutput.nextStepName, firstStepOutput);

        expect(secondFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');

        const secondStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "Yes.",
            isReprompt: false
        }

        const thirdFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            secondFlowExecutionOutput.updatedContext, secondFlowExecutionOutput.nextStepName, secondStepOutput);

        expect(thirdFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');

        const thirdStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "August First Nineteen Seventy Seven",
            isReprompt: false
        }

        const fourthFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            thirdFlowExecutionOutput.updatedContext, thirdFlowExecutionOutput.nextStepName, thirdStepOutput);

        expect(fourthFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');

        const fourthStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "I can't make it. Can we do it next Friday?",
            isReprompt: false
        }

        const fifthFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            fourthFlowExecutionOutput.updatedContext, fourthFlowExecutionOutput.nextStepName, fourthStepOutput);

        expect(fifthFlowExecutionOutput.nextInstruction.type).toBe('endCall');
    }, 10000);

    it('should properly run a flow with a repeat', async () => {
        const logger = new ConsoleFlowLogger();
        const flowEngine = FlowEngine.create(logger);
        const tenantId = '1';
        const inputRecord: Record<string, any> = {
            clinicName: 'Sunshine Medical',
            firstName: 'Chris',
            lastName: 'Carrington',
            phoneNumber: '2065551234',
            dateOfBirth: '1977-08-01',
            appointmentDate: '2025-08-08',
            appointmentTime: '10:00',
            practitioner: 'John Doe',
        }
        const initialContext: Context = {
            'inputRecord': inputRecord
        }
        const firstFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            initialContext);

        if (firstFlowExecutionOutput.nextInstruction.type === 'initiateCall') {
            expect(firstFlowExecutionOutput.nextInstruction.to).toBe('+12065551234');
        } else {
            throw new Error('Unexpected flow instruction');
        }

        const firstStepOutput: MakeCallOutput = {
            type: 'makeCall',
            result: 'LA'
        }

        const secondFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            firstFlowExecutionOutput.updatedContext, firstFlowExecutionOutput.nextStepName, firstStepOutput);

        expect(secondFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');

        const secondStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "Yes.",
            isReprompt: false
        }

        const thirdFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            secondFlowExecutionOutput.updatedContext, secondFlowExecutionOutput.nextStepName, secondStepOutput);

        expect(thirdFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');

        const thirdStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "August First Nineteen Seventy Seven",
            isReprompt: false
        }
        const fourthFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            thirdFlowExecutionOutput.updatedContext, thirdFlowExecutionOutput.nextStepName, thirdStepOutput);

        expect(fourthFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');

        const fourthStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "Is this for the dentist or the orthopedic surgeon?",
            isReprompt: false
        }
        const fifthFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            fourthFlowExecutionOutput.updatedContext, fourthFlowExecutionOutput.nextStepName, fourthStepOutput);

        expect(fifthFlowExecutionOutput.nextInstruction.type).toBe('repeat');
        expect(fifthFlowExecutionOutput.nextStepName).toBe('gatherMainIntent');

        const fifthStepOutput: NoMediaOutput = {
            type: 'noMediaOutput',
        }

        const sixthFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            fifthFlowExecutionOutput.updatedContext, fifthFlowExecutionOutput.nextStepName, fifthStepOutput);

        expect(sixthFlowExecutionOutput.nextInstruction.type).toBe('callPrompt');
        expect(sixthFlowExecutionOutput.nextStepName).toBe('gatherMainIntent');

        const sixthStepOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "I can't make it. Can we do it next Friday?",
            isReprompt: true
        }

        const seventhFlowExecutionOutput = await flowEngine.execStep(tenantId, exampleFlowConfig,
            sixthFlowExecutionOutput.updatedContext, sixthFlowExecutionOutput.nextStepName, sixthStepOutput);

        expect(seventhFlowExecutionOutput.nextInstruction.type).toBe('endCall');

    }, 20000);
});