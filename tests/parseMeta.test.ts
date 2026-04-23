import { describe, it, expect } from "vitest";
import { parseMeta } from "../src/parse-meta.js";
import { validate } from "../src/validate.js";

const FULL_SCRIPT = `#!/usr/bin/env bun
// @ts-check
// @env NODE_ENV=production
// @requires node>=18
/**
 * Deploy script
 * @version 3.0.0
 * @author ekaone
 */
import { deploy } from './deploy.js'
deploy()
`;

describe("parseMeta", () => {
  it("parses a full script header", () => {
    const m = parseMeta(FULL_SCRIPT);
    expect(m.shebang?.executor).toBe("bun");
    expect(m.directives.tsCheck).toBe(true);
    expect(m.jsdoc.version).toBe("3.0.0");
    expect(m.jsdoc.author).toBe("ekaone");
    expect(m.jsdoc.description).toBe("Deploy script");
    expect(m.env["NODE_ENV"]).toBe("production");
    expect(m.requires).toContain("node>=18");
  });

  it("returns null shebang for plain TS file", () => {
    const m = parseMeta("// @ts-check\nconsole.log(1)");
    expect(m.shebang).toBeNull();
  });

  it("headerLines is >= 1 when shebang present", () => {
    const m = parseMeta("#!/usr/bin/env bun\nconsole.log(1)");
    expect(m.headerLines).toBeGreaterThanOrEqual(1);
  });

  it("headerLines accounts for JSDoc block end", () => {
    const m = parseMeta(FULL_SCRIPT);
    expect(m.headerLines).toBeGreaterThan(3);
  });

  it("handles completely empty source", () => {
    const m = parseMeta("");
    expect(m.shebang).toBeNull();
    expect(m.directives.tsCheck).toBe(false);
    expect(m.jsdoc.version).toBeNull();
    expect(m.headerLines).toBe(0);
  });

  it("handles BOM-prefixed source", () => {
    const m = parseMeta("\uFEFF#!/usr/bin/env tsx\n");
    expect(m.shebang?.executor).toBe("tsx");
  });

  it("handles python script", () => {
    const m = parseMeta('#!/usr/bin/env python3\nprint("hello")');
    expect(m.shebang?.executor).toBe("python3");
  });
});

describe("validate", () => {
  it("passes when shebang is present", () => {
    const r = validate("#!/usr/bin/env bun\n", "build.ts", ["shebang"]);
    expect(r.passed).toBe(true);
    expect(r.failures).toHaveLength(0);
  });

  it("fails when shebang is missing", () => {
    const r = validate("console.log(1)", "build.ts", ["shebang"]);
    expect(r.passed).toBe(false);
    expect(r.failures[0]).toMatch(/shebang/);
  });

  it("passes ts-check rule", () => {
    const r = validate("// @ts-check\n", "f.ts", ["ts-check"]);
    expect(r.passed).toBe(true);
  });

  it("fails ts-check rule when missing", () => {
    const r = validate("console.log(1)", "f.ts", ["ts-check"]);
    expect(r.passed).toBe(false);
  });

  it("passes version rule", () => {
    const src = "/**\n * @version 1.0.0\n */\n";
    const r = validate(src, "f.ts", ["version"]);
    expect(r.passed).toBe(true);
  });

  it("fails version rule when missing", () => {
    const r = validate("console.log(1)", "f.ts", ["version"]);
    expect(r.passed).toBe(false);
  });

  it("passes executor= rule", () => {
    const r = validate("#!/usr/bin/env bun\n", "f.ts", ["executor=bun"]);
    expect(r.passed).toBe(true);
  });

  it("fails executor= rule on mismatch", () => {
    const r = validate("#!/usr/bin/env tsx\n", "f.ts", ["executor=bun"]);
    expect(r.passed).toBe(false);
    expect(r.failures[0]).toMatch(/executor mismatch/);
  });

  it("fails executor= rule when no shebang", () => {
    const r = validate("console.log(1)", "f.ts", ["executor=bun"]);
    expect(r.passed).toBe(false);
  });

  it("collects multiple failures", () => {
    const r = validate("console.log(1)", "f.ts", [
      "shebang",
      "ts-check",
      "version",
    ]);
    expect(r.failures).toHaveLength(3);
  });

  it("includes meta in result", () => {
    const r = validate("#!/usr/bin/env bun\n", "f.ts", ["shebang"]);
    expect(r.meta.shebang?.executor).toBe("bun");
  });

  it("includes file name in result", () => {
    const r = validate("", "my-script.ts", ["shebang"]);
    expect(r.file).toBe("my-script.ts");
  });
});
