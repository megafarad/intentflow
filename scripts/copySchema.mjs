// scripts/copy-schemas.mjs
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const from = path.resolve("src/schemas/FlowConfig.schema.json");
const toDir = path.resolve("dist/schemas");
const to = path.join(toDir, "FlowConfig.schema.json");

void mkdir(toDir, { recursive: true }).then(async () => copyFile(from, to));
