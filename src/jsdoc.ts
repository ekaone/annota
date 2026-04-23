import type { JSDocResult } from './types.js'

/**
 * Extract the first JSDoc block (`/** ... *\/`) near the top of the file
 * (within the first 60 lines, after optional shebang + directives).
 *
 * Recognised tags: `@description`, `@version`, `@author`, and any others.
 */
export function parseJSDoc(source: string): JSDocResult {
  const empty: JSDocResult = { description: null, version: null, author: null, tags: {} }

  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).slice(0, 60)

  // Find opening `/**`
  const openIdx = lines.findIndex(l => /^\s*\/\*\*/.test(l))
  if (openIdx === -1) return empty

  // Find closing `*/`
  let closeIdx = -1
  for (let i = openIdx; i < lines.length; i++) {
    if (/\*\//.test(lines[i]!)) { closeIdx = i; break }
  }
  if (closeIdx === -1) return empty

  // Extract inner lines, strip leading ` * `
  const inner = lines.slice(openIdx, closeIdx + 1)
    .map(l => l.replace(/^\s*\/?(\*{1,2}\/?)?\s?/, '').replace(/\s*\*\/$/, '').trim())
    .filter(l => l.length > 0 && l !== '/')

  const tags: Record<string, string> = {}
  let description: string | null = null
  let version: string | null = null
  let author: string | null = null

  // Collect bare description lines (before first @tag)
  const descLines: string[] = []

  for (const line of inner) {
    const tagMatch = line.match(/^@(\w+)\s*(.*)$/)
    if (!tagMatch) {
      if (Object.keys(tags).length === 0 && !line.startsWith('@')) {
        descLines.push(line)
      }
      continue
    }

    const [, tag, value] = tagMatch as [string, string, string]
    const trimmed = value.trim()

    if (tag === 'description') {
      description = trimmed || null
    } else if (tag === 'version') {
      version = trimmed || null
    } else if (tag === 'author') {
      author = trimmed || null
    } else {
      tags[tag] = trimmed
    }
  }

  if (!description && descLines.length > 0) {
    description = descLines.join(' ').trim() || null
  }

  return { description, version, author, tags }
}
