import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  expandTemplate,
  expandPath,
  expandTemplateDirectory,
  extractVariables,
  extractVariablesFromDirectory,
} from "@mir/core";

describe("expandTemplate", () => {
  it("単純な変数を展開する", () => {
    expect(expandTemplate("Hello {{ name }}", { name: "World" })).toBe(
      "Hello World",
    );
  });

  it("複数の変数を展開する", () => {
    const result = expandTemplate("{{ greeting }} {{ name }}!", {
      greeting: "Hi",
      name: "Alice",
    });
    expect(result).toBe("Hi Alice!");
  });

  it("#if ブロック (true)", () => {
    const template = "{{#if useTs}}TypeScript{{/if}}";
    expect(expandTemplate(template, { useTs: true })).toBe("TypeScript");
  });

  it("#if ブロック (false)", () => {
    const template = "{{#if useTs}}TypeScript{{/if}}";
    expect(expandTemplate(template, { useTs: false })).toBe("");
  });

  it("#each ブロック", () => {
    const template = "{{#each items}}{{this}}\n{{/each}}";
    expect(expandTemplate(template, { items: ["a", "b", "c"] })).toBe(
      "a\nb\nc\n",
    );
  });

  it("ハイフン入り変数名を展開する", () => {
    expect(
      expandTemplate("{{ component-name }}", { "component-name": "Button" }),
    ).toBe("Button");
  });
});

describe("expandPath", () => {
  it("ファイル名を展開する", () => {
    const result = expandPath("{{ name }}.ts", { name: "useAuth" });
    expect(result).toBe("useAuth.ts");
  });

  it("ディレクトリ名も展開する", () => {
    const result = expandPath(
      path.join("{{ dir }}", "{{ name }}.ts"),
      { dir: "hooks", name: "useAuth" },
    );
    expect(result).toBe(path.join("hooks", "useAuth.ts"));
  });

  it("変数値にスラッシュを含むパスを展開する", () => {
    const result = expandPath(
      path.join("{{baseDir}}", "index.ts"),
      { baseDir: "hoge/fuga" },
    );
    expect(result).toBe(path.join("hoge", "fuga", "index.ts"));
  });

  it("変数値にネストしたパスを含む場合も正規化される", () => {
    const result = expandPath("{{baseDir}}/file.ts", {
      baseDir: "src/components",
    });
    expect(result).toBe(path.join("src", "components", "file.ts"));
  });
});

describe("extractVariables", () => {
  it("単純な変数を抽出する", () => {
    const result = extractVariables("Hello {{ name }}");
    expect(result).toEqual(["name"]);
  });

  it("複数の変数を抽出する", () => {
    const result = extractVariables("{{ greeting }} {{ name }}!");
    expect(result).toContain("greeting");
    expect(result).toContain("name");
  });

  it("#if ブロックの変数を抽出する", () => {
    const result = extractVariables("{{#if useTs}}TypeScript{{/if}}");
    expect(result).toContain("useTs");
  });

  it("重複を除去する", () => {
    const result = extractVariables("{{ name }} {{ name }}");
    expect(result).toEqual(["name"]);
  });

  it("変数がない場合は空配列を返す", () => {
    expect(extractVariables("no variables here")).toEqual([]);
  });
});

describe("extractVariablesFromDirectory", () => {
  let extractTmpDir: string;

  beforeEach(() => {
    extractTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-extract-"));
  });

  afterEach(() => {
    fs.rmSync(extractTmpDir, { recursive: true, force: true });
  });

  it("ディレクトリ内の全ファイルから変数を抽出する", () => {
    const dir = path.join(extractTmpDir, "extract-test");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "{{ name }}.ts"), "{{ value }}", "utf-8");

    const result = extractVariablesFromDirectory(dir);
    expect(result).toContain("name");
    expect(result).toContain("value");
  });

  it("存在しないディレクトリは空配列を返す", () => {
    expect(extractVariablesFromDirectory("/nonexistent")).toEqual([]);
  });
});

describe("expandTemplateDirectory", () => {
  let tmpDir: string;
  let registryPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-template-"));
    registryPath = tmpDir;

    const snippetDir = path.join(tmpDir, "my-snippet");
    fs.mkdirSync(snippetDir, { recursive: true });
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.ts"),
      "export function {{ name }}() {}",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.test.ts"),
      "import { {{ name }} } from './{{ name }}'",
      "utf-8",
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("テンプレートディレクトリ全体を展開する", () => {
    const result = expandTemplateDirectory(registryPath, "my-snippet", {
      name: "useAuth",
    });

    expect(result.size).toBe(2);
    expect(result.get("useAuth.ts")).toBe("export function useAuth() {}");
    expect(result.get("useAuth.test.ts")).toBe(
      "import { useAuth } from './useAuth'",
    );
  });
});
