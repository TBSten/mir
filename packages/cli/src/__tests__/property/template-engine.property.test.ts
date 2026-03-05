import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { expandTemplate, expandPath, extractVariables } from "@mir/core";

describe("expandTemplate property-based", () => {
  it("空テンプレートは空文字を返す", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()),
        (vars) => {
          expect(expandTemplate("", vars)).toBe("");
        },
      ),
    );
  });

  it("変数を含まないテンプレートはそのまま返る", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes("{") && !s.includes("}")),
        (template) => {
          expect(expandTemplate(template, {})).toBe(template);
        },
      ),
    );
  });

  it("単一変数の展開は変数値に置き換わる", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        fc.string({ maxLength: 100 }),
        (key, value) => {
          const result = expandTemplate(`{{ ${key} }}`, { [key]: value });
          expect(result).toBe(value);
        },
      ),
    );
  });

  it("展開結果に元のテンプレートマーカーが残らない", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]\w*$/.test(s)),
        fc.string({ maxLength: 50 }).filter((s) => !s.includes("{") && !s.includes("}")),
        (key, value) => {
          const result = expandTemplate(`{{ ${key} }}`, { [key]: value });
          expect(result).not.toContain(`{{ ${key} }}`);
        },
      ),
    );
  });
});

describe("expandPath property-based", () => {
  it("展開結果にテンプレートマーカーが残らない", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]\w*$/.test(s)),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        (key, value) => {
          const result = expandPath(`{{ ${key} }}.ts`, { [key]: value });
          expect(result).not.toContain("{{");
          expect(result.endsWith(".ts")).toBe(true);
        },
      ),
    );
  });
});

describe("extractVariables property-based", () => {
  it("{{ var }} で囲まれた変数名を抽出できる", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
        (varName) => {
          const vars = extractVariables(`prefix {{ ${varName} }} suffix`);
          expect(vars).toContain(varName);
        },
      ),
    );
  });

  it("変数のない文字列からは空配列が返る", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }).filter((s) => !s.includes("{") && !s.includes("}")),
        (text) => {
          expect(extractVariables(text)).toEqual([]);
        },
      ),
    );
  });
});
