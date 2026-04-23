import { defineConfig } from "tsup";

export default defineConfig([
  // Library (SDK) entry
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    shims: true,
    outDir: "dist",
    target: "node18",
  },

  // CLI entry

  {
    entry: { cli: "src/cli.ts" },
    format: ["cjs"],
    outExtension: () => ({ js: ".cjs" }),
    dts: false,
    clean: false,
    sourcemap: false,
    shims: true,
    banner: { js: "#!/usr/bin/env node" },
    outDir: "dist",
    target: "node18",
  },
]);
