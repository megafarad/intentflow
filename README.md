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
  "links": {},
  "steps": [
    {
      "type": "playMessage",
      "name": "welcome",
      "message": {
        "elements": [
          { "type": "tts", "text": "Hello! Welcome to IntentFlow." }
        ]
      }
    },
    {
      "type": "endCall",
      "name": "done"
    }
  ]
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
import { ConsoleFlowLogger, FlowEngine } from "@sirhc77/intentflow";

const logger = new ConsoleFlowLogger();


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
```
bash
npm run build
```
Test:
```
bash
npm test
```
---

## Environment variables

The repository contains a `.env` file and depends on `dotenv`. If your flows use features that call external services (for example, OpenAI via the `openai` package), you’ll typically need environment variables like an API key.

Use placeholders and keep secrets out of git:
```
bash
OPENAI_API_KEY=<your_api_key_here>
```
(Exact variable names depend on how your app wires dependencies into the engine.)

---

## Project structure (high level)

- `src/engine/` — flow execution (engine, runner, resolver, handlers)
- `src/core/` — shared types / model
- `src/secrets/` — secret management utilities
- `schema/` — JSON Schema for flow config
- `test/` — Vitest test suite
- `dist/` — build output (published)

---

## License

This project is currently marked **UNLICENSED** in `package.json`. If you intend others to use it, consider adding an explicit license.

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
Yes. Use `schema/flowConfig.schema.json` with your preferred JSON Schema validator.
```


If you want, I can also:
- add a **complete “Working Example”** section once you confirm the intended public entrypoint (e.g., “create engine → run(initialData)”),
- include **recommended validation tooling** (Ajv, etc.) and a short snippet showing how to validate configs against the provided schema.
