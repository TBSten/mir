import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { createSnippet } from "../../commands/create.js";
import {
  SnippetAlreadyExistsError,
  ValidationError,
} from "@mir/core";

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-create-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("createSnippet", () => {
  it("snippet の雛形を作成する", () => {
    createSnippet("my-component", {}, tmpDir);

    const yamlPath = path.join(tmpDir, ".mir/snippets/my-component.yaml");
    expect(fs.existsSync(yamlPath)).toBe(true);

    const dirPath = path.join(tmpDir, ".mir/snippets/my-component");
    expect(fs.existsSync(dirPath)).toBe(true);
    expect(fs.statSync(dirPath).isDirectory()).toBe(true);
  });

  it("YAML の内容が正しい", () => {
    createSnippet("test-snippet", {}, tmpDir);

    const yamlPath = path.join(tmpDir, ".mir/snippets/test-snippet.yaml");
    const content = fs.readFileSync(yamlPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect(parsed.name).toBe("test-snippet");
    expect(parsed.description).toBe("");
    expect(parsed.variables).toEqual({});
    expect(parsed.hooks).toEqual({
      "before-install": [],
      "after-install": [],
    });
  });

  it("description 付きで作成できる", () => {
    createSnippet(
      "my-hook",
      { description: "React カスタムフック" },
      tmpDir,
    );

    const yamlPath = path.join(tmpDir, ".mir/snippets/my-hook.yaml");
    const content = fs.readFileSync(yamlPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;

    expect(parsed.description).toBe("React カスタムフック");
  });

  it("既に存在する場合はエラーを投げる", () => {
    createSnippet("existing", {}, tmpDir);

    expect(() => createSnippet("existing", {}, tmpDir)).toThrow(
      SnippetAlreadyExistsError,
    );
  });

  it("不正な名前でエラーを投げる", () => {
    expect(() => createSnippet("-invalid", {}, tmpDir)).toThrow(
      ValidationError,
    );
    expect(() => createSnippet("", {}, tmpDir)).toThrow(ValidationError);
  });

  it(".mir/snippets/ ディレクトリを自動作成する", () => {
    const snippetsDir = path.join(tmpDir, ".mir/snippets");
    expect(fs.existsSync(snippetsDir)).toBe(false);

    createSnippet("test", {}, tmpDir);

    expect(fs.existsSync(snippetsDir)).toBe(true);
  });
});
