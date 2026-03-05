import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateSnippetName } from "../../lib/validate-name.js";
import { ValidationError } from "../../lib/errors.js";

const VALID_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

const alphaNumChar = fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
const alphaNumHyphenChar = fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-");

/** パターンに合致する名前を生成する arbitrary */
const validNameArb = fc
  .tuple(
    alphaNumChar,
    fc.array(alphaNumHyphenChar, { minLength: 0, maxLength: 30 }),
  )
  .map(([first, rest]) => first + rest.join(""));

describe("validateSnippetName property-based", () => {
  it("有効な名前は throw しない", () => {
    fc.assert(
      fc.property(validNameArb, (name) => {
        expect(() => validateSnippetName(name)).not.toThrow();
      }),
    );
  });

  it("先頭がハイフンの名前は throw する", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-"),
          { minLength: 0, maxLength: 20 },
        ),
        (rest) => {
          const name = "-" + rest.join("");
          expect(() => validateSnippetName(name)).toThrow(ValidationError);
        },
      ),
    );
  });

  it("特殊文字を含む名前は throw する", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !VALID_NAME_PATTERN.test(s),
        ),
        (name) => {
          expect(() => validateSnippetName(name)).toThrow(ValidationError);
        },
      ),
    );
  });

  it("空文字は throw する", () => {
    expect(() => validateSnippetName("")).toThrow(ValidationError);
  });

  it("有効な名前で2回呼んでも結果が同じ (冪等性)", () => {
    fc.assert(
      fc.property(validNameArb, (name) => {
        const first = () => validateSnippetName(name);
        const second = () => validateSnippetName(name);
        expect(first).not.toThrow();
        expect(second).not.toThrow();
      }),
    );
  });
});
