import type { EnvHints, RequiresHints } from './types.js'

const ENV_RE = /^\s*\/\/\s*@env\s+([A-Z_][A-Z0-9_]*)=(.*)$/
const REQUIRES_RE = /^\s*\/\/\s*@requires\s+(.+)$/

/**
 * Extract `// @env KEY=value` hints from the first 40 lines.
 */
export function parseEnvHints(source: string): EnvHints {
  const hints: EnvHints = {}
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).slice(0, 40)

  for (const line of lines) {
    const m = line.match(ENV_RE)
    if (m) hints[m[1]!] = m[2]!.trim()
  }

  return hints
}

/**
 * Extract `// @requires specifier` hints from the first 40 lines.
 * e.g. `// @requires node>=18`  →  `['node>=18']`
 */
export function parseRequiresHints(source: string): RequiresHints {
  const hints: RequiresHints = []
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).slice(0, 40)

  for (const line of lines) {
    const m = line.match(REQUIRES_RE)
    if (m) hints.push(m[1]!.trim())
  }

  return hints
}
