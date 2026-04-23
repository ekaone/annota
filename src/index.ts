/**
 * @file index.ts
 * @description Core entry point for @ekaone/annota.
 * @author Eka Prasetia
 * @website https://prasetia.me
 * @license MIT
 */

export { parseMeta } from "./parse-meta.js";
export { parseShebang } from "./shebang.js";
export { parseDirectives } from "./directives.js";
export { parseJSDoc } from "./jsdoc.js";
export { parseEnvHints, parseRequiresHints } from "./hints.js";
export { validate } from "./validate.js";
export type {
  ScriptMeta,
  ShebangResult,
  DirectivesResult,
  JSDocResult,
  EnvHints,
  RequiresHints,
  ValidateRule,
  ValidationResult,
} from "./types.js";
