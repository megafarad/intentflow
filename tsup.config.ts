import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    clean: true,
    sourcemap: true,

    // Ensure we are building a Node library (prevents “browser-y” shims)
    platform: "node",
    target: "node20",

    // Do not bundle dotenv (or node builtins if they appear via transitive deps)
    // This keeps the output clean and avoids `__require("fs")` patterns.
    external: [
        "dotenv",
        "fs",
        "node:fs",
        "path",
        "node:path",
        "os",
        "node:os"
    ],

    // Key part: don't try to bundle/resolve everything into one .d.ts
    dts: { resolve: false },
});
