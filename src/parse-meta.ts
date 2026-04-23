import { parseShebang } from './shebang.js'
import { parseDirectives } from './directives.js'
import { parseJSDoc } from './jsdoc.js'
import { parseEnvHints, parseRequiresHints } from './hints.js'
import type { ScriptMeta } from './types.js'

/**
 * Parse all metadata from the header of a script source string.
 *
 * @param source - Raw file contents (UTF-8 string, BOM-safe, CRLF-safe)
 * @returns Parsed `ScriptMeta` object
 *
 * @example
 * ```ts
 * import { readFileSync } from 'node:fs'
 * import { parseMeta } from '@ekaone/annota'
 *
 * const source = readFileSync('./build.ts', 'utf8')
 * const meta = parseMeta(source)
 * console.log(meta.shebang?.executor) // 'bun'
 * ```
 */
export function parseMeta(source: string): ScriptMeta {
  const clean = source.startsWith('\uFEFF') ? source.slice(1) : source
  const lines = clean.split(/\r?\n/)

  const shebang = parseShebang(clean)
  const directives = parseDirectives(clean)
  const jsdoc = parseJSDoc(clean)
  const env = parseEnvHints(clean)
  const requires = parseRequiresHints(clean)

  // Estimate headerLines: last line that is part of the header block
  let headerLines = 0
  if (shebang) headerLines = Math.max(headerLines, 1)

  // Find end of JSDoc block
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    if (/\*\//.test(lines[i]!)) {
      headerLines = Math.max(headerLines, i + 1)
      break
    }
  }

  return { shebang, directives, jsdoc, env, requires, headerLines }
}
