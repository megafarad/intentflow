import {StepRunner} from "../src/engine/stepRunner";
import {CallPromptOutput, GatherIntentStep} from "../src";

const gatherIntentStep: GatherIntentStep = {
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
}

describe('gatherIntentStep', () => {
    it('should gather the intent with an entity', async () => {
        const context = {
            inputRecord: {
                clinicName: 'Sunshine Medical',
                practitioner: 'John Doe',
                appointmentDate: '2025-08-08',
                appointmentTime: '10:00',
            }
        }

        const callInstructionOutput: CallPromptOutput = {
            type: 'callPrompt',
            utterance: "I can't make it. Can we do it next Friday?",
            isReprompt: false
        }

        const stepRunner = StepRunner.createDemoStepRunner();

        const stepOutput = await stepRunner.runStep('1', gatherIntentStep, callInstructionOutput,
            context);

        if (stepOutput.type === 'gatherIntent') {
            expect(stepOutput.intent).toBe('proposeAppointment');
            expect(stepOutput.entity.proposal).toBe('next Friday');
            expect(stepOutput.attempts).toBe(1);
        } else {
            throw new Error('Unexpected step output');
        }
    });
});