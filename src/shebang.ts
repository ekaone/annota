import type { ShebangResult } from "./types.js";

const SHEBANG_RE = /^#!(.+)/;

/**
 * Parse the shebang line from a raw source string.
 * Strips BOM, handles CRLF.
 * Returns `null` if no shebang is present.
 */
export function parseShebang(source: string): ShebangResult | null {
  // Strip UTF-8 BOM if present
  const clean = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const firstLine = clean.split(/\r?\n/)[0] ?? "";

  const match = firstLine.match(SHEBANG_RE);
  if (!match) return null;

  const raw = firstLine;
  const rest = (match[1] ?? "").trim();

  // Handle `/usr/bin/env` style: `env [-S] executor [args...]`
  // e.g. `/usr/bin/env bun` → executor=bun
  //      `/usr/bin/env -S ts-node --files` → executor=ts-node, args=['--files']
  //      `/usr/bin/python3` → executor=python3
  const parts = rest.split(/\s+/).filter(Boolean);

  let executor: string;
  let args: string[];

  const envIdx = parts.findIndex((p) => /env$/.test(p));
  if (envIdx !== -1) {
    // Skip `env` itself, then skip leading env flags (single-char flags like -S, -u NAME)
    // The first non-flag token is the executor; everything after are its args
    const afterEnv = parts.slice(envIdx + 1);
    let i = 0;
    // skip env's own flags: -S, -i, -u NAME (consume two tokens), etc.
    while (i < afterEnv.length) {
      const t = afterEnv[i]!;
      if (t === "-u" || t === "-C") {
        i += 2;
        continue;
      } // flag + value
      if (t.startsWith("-")) {
        i += 1;
        continue;
      } // bare flag
      break;
    }
    executor = resolveExecutorName(afterEnv[i] ?? "");
    args = afterEnv.slice(i + 1);
  } else {
    // direct path: `/usr/bin/python3` or `/bin/bash`
    executor = resolveExecutorName(parts[parts.length - 1] ?? "");
    args = [];
  }

  return { raw, executor, args };
}

/**
 * Normalise an executor path to just its basename.
 * `/usr/bin/python3.11` → `python3.11`
 */
function resolveExecutorName(p: string): string {
  if (!p) return "";
  const parts = p.split("/");
  return parts[parts.length - 1] ?? p;
}
