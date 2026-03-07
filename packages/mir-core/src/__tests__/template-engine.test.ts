/**
 * mir-core: テンプレートエンジンの unit テスト
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  expandTemplate,
  expandPath,
  extractVariables,
  extractVariablesFromDirectory,
} from "../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe("expandTemplate", () => {
  it("変数を展開する", () => {
    expect(expandTemplate("Hello, {{ name }}!", { name: "World" })).toBe(
      "Hello, World!",
    );
  });

  it("複数変数を展開する", () => {
    const result = expandTemplate(
      "{{ greeting }}, {{ name }}!",
      { greeting: "Hi", name: "User" },
    );
    expect(result).toBe("Hi, User!");
  });

  it("変数が未定義の場合は空文字に展開", () => {
    expect(expandTemplate("Hello, {{ name }}!", {})).toBe("Hello, !");
  });

  it("変数を含まないテンプレートはそのまま返す", () => {
    expect(expandTemplate("plain text", {})).toBe("plain text");
  });

  it("空テンプレートは空文字を返す", () => {
    expect(expandTemplate("", {})).toBe("");
  });

  it("Handlebars の #if ブロックを展開する", () => {
    const template = "{{#if enabled}}ON{{else}}OFF{{/if}}";
    expect(expandTemplate(template, { enabled: true })).toBe("ON");
    expect(expandTemplate(template, { enabled: false })).toBe("OFF");
  });

  it("noEscape モードで HTML タグがエスケープされない", () => {
    expect(expandTemplate("{{ html }}", { html: "<div>test</div>" })).toBe(
      "<div>test</div>",
    );
  });
});

describe("expandPath", () => {
  it("パス内の変数を展開する", () => {
    expect(expandPath("{{ name }}.ts", { name: "useAuth" })).toBe("useAuth.ts");
  });

  it("ネストしたパスの変数を展開する", () => {
    const result = expandPath("{{ dir }}/{{ name }}.ts", {
      dir: "hooks",
      name: "useAuth",
    });
    expect(result).toMatch(/hooks[/\\]useAuth\.ts/);
  });

  it("パス区切りを正規化する", () => {
    const result = expandPath("a//b/c", {});
    expect(result).not.toContain("//");
  });
});

describe("extractVariables", () => {
  it("単一変数を抽出する", () => {
    expect(extractVariables("{{ name }}")).toContain("name");
  });

  it("複数変数を抽出する", () => {
    const vars = extractVariables("{{ name }} {{ description }}");
    expect(vars).toContain("name");
    expect(vars).toContain("description");
  });

  it("重複変数は1つにまとめる", () => {
    const vars = extractVariables("{{ name }} {{ name }}");
    expect(vars.filter((v) => v === "name")).toHaveLength(1);
  });

  it("変数がない場合は空配列", () => {
    expect(extractVariables("no variables")).toEqual([]);
  });

  it("#if ブロック内の変数を抽出する", () => {
    const vars = extractVariables("{{#if enabled}}{{ name }}{{/if}}");
    expect(vars).toContain("enabled");
    expect(vars).toContain("name");
  });
});

describe("expandTemplate with helpers", () => {
  it("lowercase ヘルパー", () => {
    expect(expandTemplate("{{lowercase name}}", { name: "HELLO" })).toBe("hello");
  });

  it("uppercase ヘルパー", () => {
    expect(expandTemplate("{{uppercase name}}", { name: "hello" })).toBe("HELLO");
  });

  it("replace ヘルパー", () => {
    expect(
      expandTemplate('{{replace package "/" "."}}', { package: "com/example/app" }),
    ).toBe("com.example.app");
  });

  it("camelCase ヘルパー", () => {
    expect(expandTemplate("{{camelCase name}}", { name: "my-component" })).toBe(
      "myComponent",
    );
  });

  it("pascalCase ヘルパー", () => {
    expect(expandTemplate("{{pascalCase name}}", { name: "my-component" })).toBe(
      "MyComponent",
    );
  });

  it("snakeCase ヘルパー", () => {
    expect(expandTemplate("{{snakeCase name}}", { name: "myComponent" })).toBe(
      "my_component",
    );
  });

  it("kebabCase ヘルパー", () => {
    expect(expandTemplate("{{kebabCase name}}", { name: "MyComponent" })).toBe(
      "my-component",
    );
  });

  it("capitalize ヘルパー", () => {
    expect(expandTemplate("{{capitalize name}}", { name: "hello" })).toBe("Hello");
  });

  it("uncapitalize ヘルパー", () => {
    expect(expandTemplate("{{uncapitalize name}}", { name: "Hello" })).toBe("hello");
  });

  it("trim ヘルパー", () => {
    expect(expandTemplate("{{trim name}}", { name: "  hello  " })).toBe("hello");
  });

  it("サブ式（ネスト）: lowercase(replace(...))", () => {
    expect(
      expandTemplate('{{lowercase (replace name "/" ".")}}', {
        name: "COM/EXAMPLE/APP",
      }),
    ).toBe("com.example.app");
  });

  it("サブ式（ネスト）: pascalCase(replace(...))", () => {
    expect(
      expandTemplate('{{pascalCase (replace pkg "/" "-")}}', {
        pkg: "my/cool/component",
      }),
    ).toBe("MyCoolComponent");
  });
});

describe("extractVariables with helpers", () => {
  it("ヘルパー名を変数に含めない", () => {
    const vars = extractVariables("{{lowercase name}}");
    expect(vars).toContain("name");
    expect(vars).not.toContain("lowercase");
  });

  it("replace ヘルパーで変数のみ抽出", () => {
    const vars = extractVariables('{{replace package "/" "."}}');
    expect(vars).toContain("package");
    expect(vars).not.toContain("replace");
  });

  it("サブ式でもヘルパー名を除外", () => {
    const vars = extractVariables('{{lowercase (replace name "/" ".")}}');
    expect(vars).toContain("name");
    expect(vars).not.toContain("lowercase");
    expect(vars).not.toContain("replace");
  });

  it("ヘルパーと通常変数が混在", () => {
    const vars = extractVariables("{{name}} {{lowercase title}}");
    expect(vars).toContain("name");
    expect(vars).toContain("title");
    expect(vars).not.toContain("lowercase");
  });

  it("組み込みヘルパー (if/each) も変数に含めない", () => {
    const vars = extractVariables("{{#if enabled}}{{name}}{{/if}}");
    expect(vars).toContain("enabled");
    expect(vars).toContain("name");
    expect(vars).not.toContain("if");
  });
});

describe("extractVariablesFromDirectory", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-core-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("ファイル内容から変数を抽出する", () => {
    fs.writeFileSync(path.join(tmpDir, "index.ts"), "export {{ name }}", "utf-8");
    const vars = extractVariablesFromDirectory(tmpDir);
    expect(vars).toContain("name");
  });

  it("ファイル名から変数を抽出する", () => {
    fs.writeFileSync(path.join(tmpDir, "{{ name }}.ts"), "content", "utf-8");
    const vars = extractVariablesFromDirectory(tmpDir);
    expect(vars).toContain("name");
  });

  it("サブディレクトリ名から変数を抽出する", () => {
    const subDir = path.join(tmpDir, "{{ module }}");
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, "index.ts"), "export {}", "utf-8");
    const vars = extractVariablesFromDirectory(tmpDir);
    expect(vars).toContain("module");
  });

  it("存在しないディレクトリは空配列", () => {
    expect(extractVariablesFromDirectory("/nonexistent")).toEqual([]);
  });
});
