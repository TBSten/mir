import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  serializeSnippetYaml,
  parseSnippetYaml,
  validateSnippetDefinition,
  type SnippetDefinition,
} from "../../lib/snippet-schema.js";
import { ValidationError } from "../../lib/errors.js";

const alphaNumChar = fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
const alphaNumHyphenChar = fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-");

/** 有効な snippet 名を生成する arbitrary */
const validNameArb = fc
  .tuple(
    alphaNumChar,
    fc.array(alphaNumHyphenChar, { minLength: 0, maxLength: 20 }),
  )
  .map(([first, rest]) => first + rest.join(""));

describe("snippet-schema property-based", () => {
  it("serializeSnippetYaml → parseSnippetYaml で round-trip 可能", () => {
    fc.assert(
      fc.property(validNameArb, (name) => {
        const def: SnippetDefinition = { name };
        const yaml = serializeSnippetYaml(def);
        const parsed = parseSnippetYaml(yaml);
        expect(parsed.name).toBe(name);
      }),
    );
  });

  it("有効な name のみを持つ最小定義 → serialize/parse しても name が保持される", () => {
    fc.assert(
      fc.property(
        validNameArb,
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        (name, description) => {
          const def: SnippetDefinition = { name, description };
          const yaml = serializeSnippetYaml(def);
          const parsed = parseSnippetYaml(yaml);
          expect(parsed.name).toBe(name);
          if (description !== undefined) {
            expect(parsed.description).toBe(description);
          }
        },
      ),
    );
  });

  it("無効な name → validateSnippetDefinition が throw する", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(s),
        ),
        (invalidName) => {
          const def: SnippetDefinition = { name: invalidName };
          expect(() => validateSnippetDefinition(def)).toThrow(ValidationError);
        },
      ),
    );
  });
});
