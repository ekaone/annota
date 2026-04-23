import { parseMeta } from "./parse-meta.js";
import type { ValidateRule, ValidationResult } from "./types.js";

/**
 * Validate a script source against a set of rules.
 *
 * @param source - Raw file contents
 * @param file   - File path label (used in the result only)
 * @param rules  - Rules to enforce
 */
export function validate(
  source: string,
  file: string,
  rules: ValidateRule[],
): ValidationResult {
  const meta = parseMeta(source);
  const failures: string[] = [];

  for (const rule of rules) {
    if (rule === "shebang") {
      if (!meta.shebang) failures.push("missing shebang");
    } else if (rule === "ts-check") {
      if (!meta.directives.tsCheck)
        failures.push("missing @ts-check directive");
    } else if (rule === "version") {
      if (!meta.jsdoc.version) failures.push("missing @version in JSDoc");
    } else if (rule.startsWith("executor=")) {
      const expected = rule.slice("executor=".length);
      const actual = meta.shebang?.executor ?? null;
      if (actual !== expected) {
        failures.push(
          `executor mismatch: expected "${expected}", got "${actual ?? "none"}"`,
        );
      }
    }
  }

  return { file, passed: failures.length === 0, failures, meta };
}
