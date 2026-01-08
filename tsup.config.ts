import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    clean: true,
    sourcemap: true,

    // Key part: don't try to bundle/resolve everything into one .d.ts
    dts: { resolve: false },

    // Optional but helpful: ensure JSON imports are emitted as copied files
    esbuildOptions(options) {
        options.loader = {
            ...(options.loader ?? {}),
            ".json": "copy",
        };
    },
});
