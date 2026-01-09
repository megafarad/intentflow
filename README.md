# IntentFlow

**IntentFlow** is a TypeScript library for running *intent-driven flows*: structured “step graphs” that can gather a user’s intent, branch based on outcomes, and perform actions like playing messages or initiating/ending calls.

It’s published on NPM as `@sirhc77/intentflow`.

---

## Features

- **Flow engine** that executes a sequence/graph of named steps
- **Declarative flow configuration** (JSON) with a published JSON Schema
- Built-in step types (per the schema):
    - `makeCall`
    - `gatherIntent`
    - `playMessage`
    - `setData`
    - `restCall`
    - `endCall`
- **Templated / dynamic message elements** (TTS + dynamic fields)
- **Logging support** (exports a `FlowLogger` plus a console logger)
- Test suite powered by **Vitest**

---

## Installation
```bash
npm install @sirhc77/intentflow
```
---

## Quick start

### 1) Create a flow config

A flow config is a JSON object with:

- `id`, `name`
- `initialStepName`
- `steps`: an array of steps (each step has a `name` and `type`)
- `links`: a mapping used to connect step outcomes to the next step

A minimal example:
```json
{
  "id": "demo-flow",
  "name": "Demo Flow",
  "initialStepName": "welcome",
  "steps": [
    {
      "type": "makeCall",
      "name": "makeCall",
      "to": "inputRecord.phoneNumber",
      "from": "inputRecord.callerId",
      "timeout": 30,
      "leaveAMCondition": "true",
      "callAnnouncement": {
        "elements": [
          {
            "type": "tts",
            "text": "This is IntentFlow calling. Do not be alarmed."
          }
        ]
      },
      "outs": {
        "liveAnswer": "makeCall.result == \"LA\"",
        "answeringMachine": "makeCall.result == \"AM\"",
        "noAnswer": "makeCall.result == \"NA\"",
        "busy": "makeCall.result == \"B\"",
        "deliveryFailure": "makeCall.result == \"DF\"",
        "faxTone": "makeCall.result == \"FT\"",
        "invalidAddress": "makeCall.result == \"IA\""
      }
    },
    {
      "type": "playMessage",
      "name": "welcome",
      "message": {
        "elements": [
          {
            "type": "tts",
            "text": "This is only a test call. Thank you from IntentFlow."
          }
        ]
      },
      "outs": {
        "done": "true"
      }
    },
    {
    "type": "endCall",
    "name": "done"
    }
  ],
  "links": {
    "makeCall:liveAnswer": "welcome",
    "welcome:done": "done"
  }
}
```
> Note: Some step types support an `outs` object (a mapping of outcome → link name / next step reference depending on how you wire your flow). Keep your wiring consistent across `links` and each step’s `outs`.

### 2) Run it from your app

IntentFlow’s public API is exported from `src/index.ts` (engine + core model + loggers). Typical usage looks like:

- Import the flow engine from the package
- Instantiate the engine
- Define a FlowConfig
- Define the Context
- Optionally,
  - Provide the step name
  - Provide the media output for the step
  - Instantiate a logger
  - Define a logger subscriber ID

```ts
import { ConsoleFlowLogger, FlowEngine, FlowConfig, Context, MakeCallStepOutput } from "@sirhc77/intentflow";

const logger = new ConsoleFlowLogger();

const engine = FlowEngine.createDemoEngine();

const inputRecord: Record<string, string> = {
  clinicName: 'Sunshine Medical',
  firstName: 'Chris',
  lastName: 'Carrington',
  phoneNumber: '2065551234',
  dateOfBirth: '1977-08-01',
  appointmentDate: '2025-08-08',
  appointmentTime: '10:00',
  practitxioner: 'John Doe',
}

const initialContext: Context = {
  'inputRecord': inputRecord
}

const flowConfig: FlowConfig = {
    id: "demo-flow",
    name: "Demo Flow",
    initialStepName: "makeCall",
    steps: [
        {
            type: "makeCall",
            name: "makeCall",
            to: "inputRecord.phoneNumber",
            from: "inputRecord.callerId",
            timeout: 30,
            leaveAMCondition: "true",
            callAnnouncement: {
                elements: [
                    {
                        type: "tts",
                        text: "This is IntentFlow calling. Do not be alarmed."
                    }
                ]
            },
            outs: {
                "liveAnswer": "makeCall.result == \"LA\"",
                "answeringMachine": "makeCall.result == \"AM\"",
                "noAnswer": "makeCall.result == \"NA\"",
                "busy": "makeCall.result == \"B\"",
                "deliveryFailure": "makeCall.result == \"DF\"",
                "faxTone": "makeCall.result == \"FT\"",
                "invalidAddress": "makeCall.result == \"IA\""
            }
        },
        {
            type: "playMessage",
            name: "welcome",
            message: {
                elements: [
                    {
                        type: "tts",
                        text: "This is only a test call. Thank you from IntentFlow."
                    }
                ]
            },
            outs: {
                "done": "true"
            }
        },
        {
            type: "endCall",
            name: "done"
        }
    ],
    links: {
        "makeCall:liveAnswer": "welcome",
        "welcome:done": "done"
    }
}

const firstFlowExecutionOutput = await engine.execStep('1', flowConfig, initialContext);

// firstFlowExecutionOutput.nextInstruction?.type === "initiateCall"
// At this point, the flow engine is waiting for the user to answer the call. The developer should initiate the call, 
// then execute the next step. For the purpose of demonstration, let's assume the call was answered.

const firstStepOutput: MakeCallStepOutput = {
    type: 'makeCall',
    result: 'LA'
}

const secondFlowExecutionOutput = await engine.execStep('1', flowConfig, firstFlowConfigurationOutput.updatedContext,
        firstFlowExecutionOutput.nextStepName, firstStepOutput);

```

---

## Flow configuration schema

The project includes a JSON Schema at:

- `schema/flowConfig.schema.json`

This schema defines:

### `FlowConfig`

Required:

- `id: string`
- `name: string`
- `initialStepName: string`
- `steps: FlowStep[]`
- `links: Record<string, string>`

### Step types (high level)

- **`makeCall`**
    - Required: `name`, `from`, `to`, `timeout`, `type: "makeCall"`
    - Optional: `outs`
- **`gatherIntent`**
    - Required: `name`, `preamble`, `agentPrompt`, `intents`, `type: "gatherIntent"`
    - Optional: `outs`, `additionalInstructions`, `entityExtractionInstructions`
- **`playMessage`**
    - Required: `name`, `message`, `type: "playMessage"`
    - Optional: `outs`
- **`setData`**
    - Required: `name`, `expressions`, `type: "setData"`
    - Optional: `outs`
- **`restCall`**
    - Required: `name`, `method`, `url`, `type: "restCall"`
    - Optional: `outs`, `headers`, `body`
- **`endCall`**
    - Required: `name`, `type: "endCall"`
    - Optional: `outs`

### Message format

A `message` is a list of `elements`:

- `{ "type": "tts", "text": "..." }`
- `{ "type": "dynamic", "name": "...", "sayAs": "date|time|number|text|digits", "format"?: "..." }`

---

## Logging

IntentFlow exports:

- `FlowLogger`, `LogEntry`
- `ConsoleFlowLogger`

Use these to capture structured run information during execution (especially useful when debugging flow wiring and step outcomes).

---

## Development

### Requirements

- Node.js (recommended: current LTS)
- npm

### Scripts

Build:
```bash
npm run build
```
Test:
```bash
npm test
```
---

## Environment variables

To use the OpenAI API, configure an environment variable:

```bash
OPENAI_KEY=<your_api_key_here>
```

---

## Project structure (high level)

- `src/engine/` — flow execution (engine, runner, resolver, handlers)
- `src/core/` — shared types / model
- `src/secrets/` — secret management utilities
- `src/schemas/` — JSON Schema for flow config
- `test/` — Vitest test suite
- `dist/` — build output (published)

---

## License

This project is licensed under the GNU Lesser General Public License v3.0 (LGPL-3.0-only).

- You may use this library in proprietary applications.
- If you modify the library itself and distribute the modified version, you must make those modifications available under LGPL-3.0.

See the `LICENSE` file for details.

---

## Contributing

Issues and PRs are welcome—especially for:
- additional built-in step types
- improved schema validation + examples
- more end-to-end flow examples

---

## FAQ

### Is this a CLI?
No—IntentFlow is a library. You embed it into your own Node.js/TypeScript services.

### Can I validate my flow config?
Yes. Use `schemas/flowConfig.schema.json` with your preferred JSON Schema validator.
