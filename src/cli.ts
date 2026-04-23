import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { parseMeta } from "./parse-meta.js";
import { validate } from "./validate.js";
import type { ValidateRule } from "./types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSource(file: string): string {
  try {
    return readFileSync(resolve(file), "utf8");
  } catch {
    die(`Cannot read file: ${file}`);
  }
}

function die(msg: string): never {
  console.error(`annota: ${msg}`);
  process.exit(1);
}

function flag(args: string[], name: string): boolean {
  return args.includes(name);
}

function flagValue(args: string[], name: string): string | null {
  const idx = args.indexOf(name);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function cmdWhich(file: string): void {
  const source = readSource(file);
  const meta = parseMeta(source);
  if (!meta.shebang) die(`no shebang found in ${file}`);
  console.log(meta.shebang.executor);
}

function cmdInspect(files: string[], args: string[]): void {
  const format = flagValue(args, "--format") ?? "pretty";
  const field = flagValue(args, "--field");

  const results = files.map((file) => {
    const source = readSource(file);
    return { file, meta: parseMeta(source) };
  });

  if (format === "json") {
    console.log(
      JSON.stringify(
        results.map((r) => ({ file: r.file, ...r.meta })),
        null,
        2,
      ),
    );
    return;
  }

  if (format === "table") {
    const cols = ["FILE", "EXECUTOR", "TS-CHECK", "VERSION", "VALID"];
    const rows = results.map(({ file, meta }) => [
      file,
      meta.shebang?.executor ?? "—",
      meta.directives.tsCheck ? "✔" : "—",
      meta.jsdoc.version ?? "—",
      meta.shebang ? "✔" : "✘",
    ]);
    printTable([cols, ...rows]);
    return;
  }

  // pretty (default)
  for (const { file, meta } of results) {
    if (field) {
      const val = getField(meta, field);
      console.log(`${file}: ${val ?? "—"}`);
      continue;
    }

    const valid = meta.shebang !== null;
    const icon = valid ? "✔" : "✘";
    console.log(`\n${icon} ${file}`);
    console.log(`  executor  : ${meta.shebang?.executor ?? "—"}`);
    console.log(`  shebang   : ${meta.shebang?.raw ?? "—"}`);
    if (meta.shebang?.args.length)
      console.log(`  exec-args : ${meta.shebang.args.join(" ")}`);
    console.log(`  ts-check  : ${meta.directives.tsCheck}`);
    console.log(`  ts-nocheck: ${meta.directives.tsNoCheck}`);
    if (meta.jsdoc.description)
      console.log(`  description: ${meta.jsdoc.description}`);
    if (meta.jsdoc.version) console.log(`  version   : ${meta.jsdoc.version}`);
    if (meta.jsdoc.author) console.log(`  author    : ${meta.jsdoc.author}`);
    if (Object.keys(meta.env).length)
      console.log(`  env       : ${JSON.stringify(meta.env)}`);
    if (meta.requires.length)
      console.log(`  requires  : ${meta.requires.join(", ")}`);
  }
  console.log();
}

function cmdValidate(files: string[], args: string[]): void {
  const format = flagValue(args, "--format") ?? "pretty";
  const rules: ValidateRule[] = [];

  for (const arg of args) {
    if (!arg.startsWith("--require")) continue;
    const val = arg.includes("=")
      ? arg.split("=").slice(1).join("=")
      : args[args.indexOf(arg) + 1];
    if (!val) continue;
    rules.push(val as ValidateRule);
  }

  if (rules.length === 0) rules.push("shebang");

  const results = files.map((file) => {
    const source = readSource(file);
    return validate(source, file, rules);
  });

  if (format === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const passed = results.filter((r) => r.passed);
    const failed = results.filter((r) => !r.passed);
    console.log();
    for (const r of passed) console.log(`  ✔ ${r.file}`);
    for (const r of failed) {
      console.log(`  ✘ ${r.file}`);
      for (const f of r.failures) console.log(`      → ${f}`);
    }
    console.log();
    console.log(`  ${passed.length} passed, ${failed.length} failed`);
    console.log();
  }

  const anyFailed = results.some((r) => !r.passed);
  if (anyFailed) process.exit(1);
}

function cmdRun(file: string, args: string[]): void {
  const dryRun = flag(args, "--dry-run");
  const fallback = flagValue(args, "--fallback");

  // Collect passthrough args after `--`
  const ddIdx = args.indexOf("--");
  const passArgs = ddIdx !== -1 ? args.slice(ddIdx + 1) : [];

  const source = readSource(file);
  const meta = parseMeta(source);

  let executor = meta.shebang?.executor ?? null;
  const execArgs = meta.shebang?.args ?? [];

  if (!executor) {
    if (fallback) {
      executor = fallback;
    } else {
      die(
        `No shebang found in "${file}". Use --fallback=<executor> to specify one.`,
      );
    }
  }

  const cmd = [executor, ...execArgs, resolve(file), ...passArgs];

  if (dryRun) {
    console.log(cmd.join(" "));
    return;
  }

  const result = spawnSync(cmd[0]!, cmd.slice(1), { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getField(meta: any, field: string): string | null {
  if (field === "executor") return meta.shebang?.executor ?? null;
  if (field === "version") return meta.jsdoc?.version ?? null;
  if (field === "author") return meta.jsdoc?.author ?? null;
  if (field === "description") return meta.jsdoc?.description ?? null;
  if (field === "shebang") return meta.shebang?.raw ?? null;
  return null;
}

function printTable(rows: string[][]): void {
  if (!rows.length) return;
  const cols = rows[0]!.length;
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => (r[c] ?? "").length)),
  );
  for (const row of rows) {
    console.log(row.map((cell, c) => cell.padEnd(widths[c]! + 2)).join(""));
  }
}

function printHelp(): void {
  console.log(`
annota — script header parser and polyglot runner

Usage:
  annota run <file> [--dry-run] [--fallback=<executor>] [-- <args>]
  annota inspect <file...> [--format pretty|json|table] [--field <key>]
  annota validate <file...> [--require <rule>] [--format pretty|json]
  annota which <file>

Rules for validate:
  shebang              file must have a shebang
  ts-check             file must have // @ts-check
  version              file must have @version in JSDoc
  executor=<name>      shebang executor must match

Global flags:
  --quiet / -q         suppress output
  --help / -h          show this help
  --version            print package version
`);
}

// ─── Entry ────────────────────────────────────────────────────────────────────

const [, , cmd, ...rest] = process.argv;

if (!cmd || flag(rest, "--help") || flag(rest, "-h") || cmd === "--help") {
  printHelp();
  process.exit(0);
}

if (cmd === "--version") {
  // version injected by tsup at build time via package.json
  console.log("0.1.0");
  process.exit(0);
}

if (cmd === "which") {
  if (!rest[0]) die("which requires a file argument");
  cmdWhich(rest[0]);
} else if (cmd === "inspect") {
  const files = rest.filter((a) => !a.startsWith("--"));
  if (!files.length) die("inspect requires at least one file");
  cmdInspect(files, rest);
} else if (cmd === "validate") {
  const files = rest.filter(
    (a) =>
      !a.startsWith("--") &&
      !a.startsWith("shebang") &&
      !a.startsWith("ts-") &&
      !a.startsWith("version") &&
      !a.startsWith("executor"),
  );
  if (!files.length) die("validate requires at least one file");
  cmdValidate(files, rest);
} else if (cmd === "run") {
  if (!rest[0]) die("run requires a file argument");
  cmdRun(rest[0], rest.slice(1));
} else {
  die(`unknown command: ${cmd}. Run annota --help`);
}
