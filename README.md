# @ekaone/annota

> Script header parser and polyglot script runner. It also inspects, validates, and runs any script by reading its shebang.

```bash
npx @ekaone/annota run ./build.ts
npx @ekaone/annota run ./analyze.py
npx @ekaone/annota run ./deploy.sh
```

One command. Any language. No configuration.

---

## Install

```bash
# npm
npm install @ekaone/annota

# pnpm
pnpm add @ekaone/annota

# bun
bun add @ekaone/annota
```

---

## How it works

`annota` reads the **shebang line** (`#!`) at the top of a script to determine which runtime to use, then delegates execution to that runtime. It also parses the full script header, including JSDoc, TypeScript directives, and custom hints,exposing everything as structured data.

```
#!/usr/bin/env bun        →  bun ./build.ts
#!/usr/bin/env python3    →  python3 ./analyze.py
#!/usr/bin/env deno run   →  deno run ./server.ts
#!/usr/bin/env tsx        →  tsx ./transform.ts
#!/bin/bash               →  bash ./deploy.sh
```

---

## Supported executors

`annota run` works with any executor reachable on `PATH`. Common examples:

| Shebang | Executor |
|---------|----------|
| `#!/usr/bin/env bun` | [Bun](https://bun.sh) |
| `#!/usr/bin/env tsx` | [tsx](https://github.com/privatenumber/tsx) |
| `#!/usr/bin/env ts-node` | [ts-node](https://typestrong.org/ts-node/) |
| `#!/usr/bin/env -S deno run` | [Deno](https://deno.land) |
| `#!/usr/bin/env node` | [Node.js](https://nodejs.org) |
| `#!/usr/bin/env python3` | [Python 3](https://www.python.org) |
| `#!/usr/bin/env ruby` | [Ruby](https://www.ruby-lang.org) |
| `#!/bin/bash` | [Bash](https://www.gnu.org/software/bash/) |
| `#!/bin/sh` | [sh](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/sh.html) |

---

## CLI

### `annota run <file>` or use alias `an <file>`

Run a script using the executor declared in its shebang.

```bash
annota run ./build.ts
annota run ./scripts/migrate.py
annota run ./deploy.sh
```

**Flags**

| Flag | Description |
|------|-------------|
| `--dry-run` | Print the resolved command without executing it |
| `--fallback=<executor>` | Use this executor if no shebang is found |
| `-- <args>` | Forward arguments to the executor |

```bash
# See what command would be run
annota run ./build.ts --dry-run
# → bun /home/user/project/build.ts

# Use a fallback executor when shebang is absent
annota run ./legacy.ts --fallback=tsx

# Pass arguments through to the script
annota run ./server.ts -- --port 4000 --watch
```

> `run` is intentionally single-file only. For multi-script orchestration, use `json-cli` with `annota` as the executor layer.

---

### `annota inspect <file...>`

Parse and display the script header metadata.

```bash
annota inspect ./build.ts
annota inspect ./scripts/*.ts
annota inspect ./build.ts --format json
annota inspect ./build.ts --format table
annota inspect ./build.ts --field executor
```

**Flags**

| Flag | Description |
|------|-------------|
| `--format pretty` | Human-readable output (default) |
| `--format json` | JSON output, pipeable |
| `--format table` | Tabular summary for multiple files |
| `--field <key>` | Print a single field: `executor`, `version`, `author`, `description`, `shebang` |

**Pretty output**

```
✔ scripts/build.ts
  executor  : bun
  shebang   : #!/usr/bin/env bun
  ts-check  : true
  ts-nocheck: false
  description: Build script for the project
  version   : 2.0.0
  author    : ekaone
  env       : {"NODE_ENV":"production"}
  requires  : node>=18
```

**Table output** (`--format table`)

```
FILE              EXECUTOR   TS-CHECK   VERSION   VALID
build.ts          bun        ✔          2.0.0     ✔
deploy.ts         ts-node    ✔          —         ✔
analyze.py        python3    —          —         ✔
setup.sh          bash       —          —         ✔
broken.ts         —          —          —         ✘
```

**JSON output** (`--format json`)

```json
[
  {
    "file": "build.ts",
    "shebang": { "raw": "#!/usr/bin/env bun", "executor": "bun", "args": [] },
    "directives": { "tsCheck": true, "tsNoCheck": false },
    "jsdoc": { "description": "Build script", "version": "2.0.0", "author": "ekaone", "tags": {} },
    "env": { "NODE_ENV": "production" },
    "requires": ["node>=18"],
    "headerLines": 9
  }
]
```

---

### `annota validate <file...>`

Like `inspect` but CI-focused. Exits with code `1` if any file fails.

```bash
annota validate ./scripts/*.ts --require shebang
annota validate ./scripts/*.ts --require executor=bun
annota validate ./scripts/*.ts --require ts-check
annota validate ./scripts/*.ts --require version
```

**Available rules**

| Rule | Passes when |
|------|-------------|
| `shebang` | File has any shebang line |
| `ts-check` | File has `// @ts-check` |
| `version` | File has `@version` in JSDoc |
| `executor=<name>` | Shebang executor matches `<name>` |

Multiple `--require` flags are supported and all must pass:

```bash
annota validate ./scripts/*.ts \
  --require shebang \
  --require executor=bun \
  --require version
```

**Output**

```
  ✔ scripts/build.ts
  ✔ scripts/lint.ts
  ✘ scripts/deploy.ts
      → executor mismatch: expected "bun", got "ts-node"
  ✘ scripts/old.ts
      → missing shebang

  2 passed, 2 failed
```

**JSON output** (`--format json`)

```json
[
  { "file": "build.ts", "passed": true, "failures": [] },
  { "file": "deploy.ts", "passed": false, "failures": ["executor mismatch: expected \"bun\", got \"ts-node\""] }
]
```

---

### `annota which <file>`

Print only the resolved executor. Unix-friendly and composable.

```bash
annota which ./build.ts
# bun

# Compose with shell
$(annota which ./build.ts) ./build.ts
# Equivalent to: bun ./build.ts

# Use in scripts
EXECUTOR=$(annota which ./build.ts)
echo "Running with: $EXECUTOR"
```

---

## CI / GitHub Actions

**Validate all scripts have a shebang**

```yaml
- name: Validate script headers
  run: |
    find ./scripts -name "*.ts" -o -name "*.py" -o -name "*.sh" | \
    xargs npx @ekaone/annota validate --require shebang
```

**Enforce TypeScript scripts use bun**

```yaml
- name: Enforce executor
  run: npx @ekaone/annota validate ./scripts/*.ts --require executor=bun
```

**Pre-commit hook (husky)**

```bash
# .husky/pre-commit
npx @ekaone/annota validate \
  $(git diff --cached --name-only | grep -E "\.(ts|py|sh)$") \
  --require shebang
```

**Export report as JSON artifact**

```yaml
- name: Inspect scripts
  run: |
    npx @ekaone/annota inspect ./scripts/* --format json > script-report.json

- uses: actions/upload-artifact@v4
  with:
    name: script-report
    path: script-report.json
```

---

## Programmatic API

`annota` is also a full library. The CLI is a thin shell over the same primitives.

### `parseMeta(source)`

Parse all header metadata from a source string.

```ts
import { readFileSync } from 'node:fs'
import { parseMeta } from '@ekaone/annota'

const source = readFileSync('./build.ts', 'utf8')
const meta = parseMeta(source)

console.log(meta.shebang?.executor)   // 'bun'
console.log(meta.jsdoc.version)       // '2.0.0'
console.log(meta.directives.tsCheck)  // true
console.log(meta.env)                 // { NODE_ENV: 'production' }
console.log(meta.requires)            // ['node>=18']
```

**Returns: `ScriptMeta`**

```ts
interface ScriptMeta {
  shebang:     ShebangResult | null
  directives:  DirectivesResult
  jsdoc:       JSDocResult
  env:         Record<string, string>
  requires:    string[]
  headerLines: number
}
```

---

### `parseShebang(source)`

Parse only the shebang line.

```ts
import { parseShebang } from '@ekaone/annota'

parseShebang('#!/usr/bin/env bun\n')
// { raw: '#!/usr/bin/env bun', executor: 'bun', args: [] }

parseShebang('#!/usr/bin/env -S deno run --allow-net\n')
// { raw: '...', executor: 'deno', args: ['run', '--allow-net'] }

parseShebang('console.log(1)')
// null
```

**Returns: `ShebangResult | null`**

```ts
interface ShebangResult {
  raw:      string    // full shebang line including #!
  executor: string    // e.g. 'bun', 'python3', 'bash'
  args:     string[]  // arguments after the executor
}
```

---

### `parseDirectives(source)`

Detect TypeScript directives.

```ts
import { parseDirectives } from '@ekaone/annota'

parseDirectives('// @ts-check\nconsole.log(1)')
// { tsCheck: true, tsNoCheck: false }
```

**Returns: `DirectivesResult`**

```ts
interface DirectivesResult {
  tsCheck:   boolean
  tsNoCheck: boolean
}
```

---

### `parseJSDoc(source)`

Parse the leading JSDoc block.

```ts
import { parseJSDoc } from '@ekaone/annota'

const source = `
/**
 * Deploy script for production
 * @version 3.0.0
 * @author ekaone
 * @license MIT
 */
`

parseJSDoc(source)
// {
//   description: 'Deploy script for production',
//   version:     '3.0.0',
//   author:      'ekaone',
//   tags:        { license: 'MIT' }
// }
```

**Returns: `JSDocResult`**

```ts
interface JSDocResult {
  description: string | null
  version:     string | null
  author:      string | null
  tags:        Record<string, string>  // all other @tags
}
```

---

### `parseEnvHints(source)` / `parseRequiresHints(source)`

Parse custom inline hints.

```ts
import { parseEnvHints, parseRequiresHints } from '@ekaone/annota'

const source = `
// @env NODE_ENV=production
// @env PORT=3000
// @requires node>=18
// @requires bun
`

parseEnvHints(source)
// { NODE_ENV: 'production', PORT: '3000' }

parseRequiresHints(source)
// ['node>=18', 'bun']
```

Hints are declared as single-line comments so they're valid in any language that uses `//` comments (TypeScript, JavaScript, Rust, Go, etc.).

---

### `validate(source, file, rules)`

Validate a source string against a set of rules.

```ts
import { validate } from '@ekaone/annota'
import type { ValidateRule } from '@ekaone/annota'

const source = readFileSync('./build.ts', 'utf8')

const result = validate(source, 'build.ts', [
  'shebang',
  'ts-check',
  'version',
  'executor=bun',
])

console.log(result.passed)    // true | false
console.log(result.failures)  // string[]
console.log(result.meta)      // full ScriptMeta
```

**Returns: `ValidationResult`**

```ts
interface ValidationResult {
  file:     string
  passed:   boolean
  failures: string[]
  meta:     ScriptMeta
}
```

**Available rules**

```ts
type ValidateRule =
  | 'shebang'
  | 'ts-check'
  | 'version'
  | `executor=${string}`
```

---

## Script header conventions

A fully annotated script header looks like this:

```ts
#!/usr/bin/env bun
// @ts-check
// @env NODE_ENV=production
// @env PORT=3000
// @requires node>=18
/**
 * Build and bundle the project for production.
 * @version 2.1.0
 * @author Eka Prasetia
 * @license MIT
 */
import { build } from './build.js'
await build()
```

None of these are required. `annota` gracefully handles missing sections and returns `null` for absent fields. Use only what's useful for your project.

---

## License

MIT © [Eka Prasetia](./LICENSE)

## Links

- [npm Package](https://www.npmjs.com/package/@ekaone/annota)
- [GitHub Repository](https://github.com/ekaone/annota)
- [Issue Tracker](https://github.com/ekaone/annota/issues)

---

⭐ If this library helps you, please consider giving it a star on GitHub!
