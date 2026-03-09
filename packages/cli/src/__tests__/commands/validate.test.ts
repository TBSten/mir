import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { validateSnippet } from "../../commands/validate.js";
import { SnippetNotFoundError } from "@tbsten/mir-core";

vi.mock("../../lib/logger.js", () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-validate-"));
  fs.mkdirSync(path.join(tmpDir, ".mir", "snippets"), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeSnippetYaml(name: string, def: Record<string, unknown>): void {
  const yamlPath = path.join(tmpDir, ".mir", "snippets", `${name}.yaml`);
  fs.writeFileSync(yamlPath, yaml.dump(def), "utf-8");
}

function writeTemplateFile(snippetName: string, fileName: string, content: string): void {
  const dirPath = path.join(tmpDir, ".mir", "snippets", snippetName);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, fileName), content, "utf-8");
}

describe("validateSnippet", () => {
  it("正しい snippet 定義でバリデーション成功", () => {
    writeSnippetYaml("my-snippet", { name: "my-snippet" });
    const result = validateSnippet("my-snippet", tmpDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.definition).toBeDefined();
    expect(result.definition?.name).toBe("my-snippet");
  });

  it("存在しない snippet で SnippetNotFoundError", () => {
    expect(() => validateSnippet("nonexistent", tmpDir)).toThrow(
      SnippetNotFoundError,
    );
  });

  it("name フィールドがない場合エラー", () => {
    writeSnippetYaml("no-name", { description: "missing name" });
    const result = validateSnippet("no-name", tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("不正な variables でエラー", () => {
    writeSnippetYaml("bad-vars", {
      name: "bad-vars",
      variables: "not-object",
    });
    const result = validateSnippet("bad-vars", tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("テンプレートディレクトリがない場合 warning", () => {
    writeSnippetYaml("no-dir", { name: "no-dir" });
    const result = validateSnippet("no-dir", tmpDir);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("テンプレートに未定義の変数がある場合 warning", () => {
    writeSnippetYaml("missing-var", { name: "missing-var" });
    writeTemplateFile("missing-var", "file.txt", "Hello {{userName}}!");
    const result = validateSnippet("missing-var", tmpDir);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("userName"))).toBe(true);
  });

  it("定義済みだがテンプレートで未使用の変数がある場合 warning", () => {
    writeSnippetYaml("unused-var", {
      name: "unused-var",
      variables: {
        unusedKey: { schema: { type: "string" } },
      },
    });
    writeTemplateFile("unused-var", "file.txt", "no variables here");
    const result = validateSnippet("unused-var", tmpDir);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("unusedKey"))).toBe(true);
  });

  it("変数がテンプレートと定義で一致している場合 warning なし", () => {
    writeSnippetYaml("matched", {
      name: "matched",
      variables: {
        name: { schema: { type: "string" } },
      },
    });
    writeTemplateFile("matched", "file.txt", "Hello {{name}}!");
    const result = validateSnippet("matched", tmpDir);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
