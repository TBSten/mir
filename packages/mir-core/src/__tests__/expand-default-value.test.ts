import { describe, it, expect } from "vitest";
import { expandDefaultValue, expandTemplate, extractVariables } from "../index.js";

describe("expandDefaultValue", () => {
  it("テンプレート構文を含まない文字列はそのまま返す", () => {
    expect(expandDefaultValue("hello", {})).toBe("hello");
  });

  it("テンプレート構文を含む文字列を展開する", () => {
    expect(
      expandDefaultValue("{{ name }}-utils", { name: "react" }),
    ).toBe("react-utils");
  });

  it("replace ヘルパーで変換して展開する", () => {
    expect(
      expandDefaultValue('{{ replace packageDir "/" "." }}', {
        packageDir: "com/example/app",
      }),
    ).toBe("com.example.app");
  });

  it("dotCase ヘルパーで変換", () => {
    expect(
      expandDefaultValue("{{ dotCase packageDir }}", {
        packageDir: "com/example/app",
      }),
    ).toBe("com.example.app");
  });

  it("pathCase ヘルパーで変換", () => {
    expect(
      expandDefaultValue("{{ pathCase packageName }}", {
        packageName: "com.example.app",
      }),
    ).toBe("com/example/app");
  });

  it("数値型の default はそのまま返す", () => {
    expect(expandDefaultValue(42, {})).toBe(42);
  });

  it("boolean 型の default はそのまま返す", () => {
    expect(expandDefaultValue(true, {})).toBe(true);
  });

  it("null はそのまま返す", () => {
    expect(expandDefaultValue(null, {})).toBe(null);
  });

  it("undefined はそのまま返す", () => {
    expect(expandDefaultValue(undefined, {})).toBe(undefined);
  });

  it("ネストしたヘルパー呼び出しを展開する", () => {
    expect(
      expandDefaultValue(
        '{{ uppercase (replace dir "/" ".") }}',
        { dir: "com/example/app" },
      ),
    ).toBe("COM.EXAMPLE.APP");
  });

  it("複数の変数を参照して展開する", () => {
    expect(
      expandDefaultValue("{{ name }}-{{ version }}", {
        name: "my-lib",
        version: "1.0",
      }),
    ).toBe("my-lib-1.0");
  });

  it("未定義の変数は空文字に展開される", () => {
    expect(expandDefaultValue("prefix-{{ missing }}", {})).toBe("prefix-");
  });
});

describe("expandTemplate with new helpers", () => {
  it("contains ヘルパー", () => {
    expect(
      expandTemplate('{{#if (contains name "test")}}TEST{{else}}PROD{{/if}}', {
        name: "my-test-app",
      }),
    ).toBe("TEST");
  });

  it("startsWith ヘルパー", () => {
    expect(
      expandTemplate('{{#if (startsWith name "use")}}HOOK{{else}}OTHER{{/if}}', {
        name: "useState",
      }),
    ).toBe("HOOK");
  });

  it("endsWith ヘルパー", () => {
    expect(
      expandTemplate('{{#if (endsWith file ".ts")}}TS{{else}}OTHER{{/if}}', {
        file: "index.ts",
      }),
    ).toBe("TS");
  });

  it("dotCase ヘルパー", () => {
    expect(
      expandTemplate("{{dotCase pkg}}", { pkg: "com/example/app" }),
    ).toBe("com.example.app");
  });

  it("pathCase ヘルパー", () => {
    expect(
      expandTemplate("{{pathCase pkg}}", { pkg: "com.example.app" }),
    ).toBe("com/example/app");
  });

  it("concat ヘルパー", () => {
    expect(
      expandTemplate('{{concat name "-" version}}', {
        name: "lib",
        version: "2",
      }),
    ).toBe("lib-2");
  });

  it("slice ヘルパー", () => {
    expect(
      expandTemplate("{{slice name 0 3}}", { name: "hello" }),
    ).toBe("hel");
  });

  it("length ヘルパー", () => {
    expect(
      expandTemplate("{{length name}}", { name: "hello" }),
    ).toBe("5");
  });
});

describe("extractVariables with new helpers", () => {

  it("新ヘルパー名を変数に含めない", () => {
    const vars = extractVariables("{{dotCase pkg}}");
    expect(vars).toContain("pkg");
    expect(vars).not.toContain("dotCase");
  });

  it("contains をヘルパーとして除外", () => {
    const vars = extractVariables('{{#if (contains name "test")}}yes{{/if}}');
    expect(vars).toContain("name");
    expect(vars).not.toContain("contains");
  });

  it("concat のパラメータから変数を抽出", () => {
    const vars = extractVariables('{{concat name "-" version}}');
    expect(vars).toContain("name");
    expect(vars).toContain("version");
    expect(vars).not.toContain("concat");
  });
});
