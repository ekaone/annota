// ─── Shebang ──────────────────────────────────────────────────────────────────

export interface ShebangResult {
  /** Raw shebang line including `#!` */
  raw: string
  /** Resolved executor name e.g. `bun`, `python3`, `bash` */
  executor: string
  /** Arguments after the executor e.g. `['run', '--allow-net']` */
  args: string[]
}

// ─── TypeScript directives ────────────────────────────────────────────────────

export interface DirectivesResult {
  /** `// @ts-check` present */
  tsCheck: boolean
  /** `// @ts-nocheck` present */
  tsNoCheck: boolean
}

// ─── JSDoc frontmatter ────────────────────────────────────────────────────────

export interface JSDocResult {
  /** `@description` or first bare line of JSDoc block */
  description: string | null
  /** `@version` */
  version: string | null
  /** `@author` */
  author: string | null
  /** All other tags as key→value (last-write-wins for duplicates) */
  tags: Record<string, string>
}

// ─── Env hints ────────────────────────────────────────────────────────────────

/** `// @env KEY=value` lines → `{ KEY: 'value' }` */
export type EnvHints = Record<string, string>

/** `// @requires specifier` lines e.g. `node>=18`, `bun` */
export type RequiresHints = string[]

// ─── Top-level result ─────────────────────────────────────────────────────────

export interface ScriptMeta {
  /** Parsed shebang, or `null` if absent */
  shebang: ShebangResult | null
  /** TypeScript directives */
  directives: DirectivesResult
  /** Leading JSDoc block */
  jsdoc: JSDocResult
  /** `@env` hints */
  env: EnvHints
  /** `@requires` hints */
  requires: RequiresHints
  /** Number of lines consumed by the header (0-based exclusive upper bound) */
  headerLines: number
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidateRule =
  | 'shebang'
  | 'ts-check'
  | 'version'
  | `executor=${string}`

export interface ValidationResult {
  file: string
  passed: boolean
  failures: string[]
  meta: ScriptMeta
}
