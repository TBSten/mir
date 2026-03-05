import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateOutputPath, parseVariableArgs } from "../../commands/install.js";
import { PathTraversalError } from "@mir/core";

const safePathChar = fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789_-.");

describe("validateOutputPath property-based", () => {
  const outDir = "/tmp/mir-out";

  it("outDir 内の相対パスは throw しない", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(safePathChar, { minLength: 1, maxLength: 15 }).map((chars) => chars.join("")),
          { minLength: 1, maxLength: 4 },
        ),
        (segments) => {
          const filePath = segments.join("/");
          expect(() => validateOutputPath(filePath, outDir)).not.toThrow();
        },
      ),
    );
  });

  it("../ を含むパス (outDir から脱出) は throw する", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(
            fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"),
            { minLength: 1, maxLength: 10 },
          ).map((chars) => chars.join("")),
          { minLength: 0, maxLength: 3 },
        ),
        (trailSegments) => {
          const traversal = "../".repeat(10) + trailSegments.join("/");
          expect(() => validateOutputPath(traversal, outDir)).toThrow(
            PathTraversalError,
          );
        },
      ),
    );
  });
});

describe("parseVariableArgs property-based", () => {
  it("--key=value 形式の引数は key と value が正しく分離される", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        fc.string({ maxLength: 50 }),
        (key, value) => {
          const result = parseVariableArgs([`--${key}=${value}`]);
          expect(result[key]).toBe(value);
        },
      ),
    );
  });

  it("--key=value でない引数は無視される", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !s.startsWith("--") || !s.includes("="),
        ),
        (arg) => {
          const result = parseVariableArgs([arg]);
          expect(Object.keys(result).length).toBe(0);
        },
      ),
    );
  });

  it("結果のキーと値が入力に対応する (ユニークキー)", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            fc.string({ maxLength: 30 }).filter((s) => !s.includes("\n")),
          ),
          { minLength: 1, maxLength: 5, selector: ([k]) => k },
        ),
        (pairs) => {
          const args = pairs.map(([k, v]) => `--${k}=${v}`);
          const result = parseVariableArgs(args);
          for (const [key, value] of pairs) {
            expect(result[key]).toBe(value);
          }
        },
      ),
    );
  });
});
