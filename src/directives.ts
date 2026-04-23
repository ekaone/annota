import type { DirectivesResult } from './types.js'

const TS_CHECK_RE = /^\s*\/\/\s*@ts-check\s*$/
const TS_NOCHECK_RE = /^\s*\/\/\s*@ts-nocheck\s*$/

/**
 * Scan source lines for `@ts-check` / `@ts-nocheck` directives.
 * Only searches within the first 20 lines (TypeScript itself only checks the first line,
 * but we're lenient for documentation purposes).
 */
export function parseDirectives(source: string): DirectivesResult {
  const lines = source
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .slice(0, 20)

  let tsCheck = false
  let tsNoCheck = false

  for (const line of lines) {
    if (TS_CHECK_RE.test(line)) tsCheck = true
    if (TS_NOCHECK_RE.test(line)) tsNoCheck = true
  }

  return { tsCheck, tsNoCheck }
}
