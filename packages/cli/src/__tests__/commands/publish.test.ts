import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { createSnippet } from "../../commands/create.js";
import { publishSnippet } from "../../commands/publish.js";
import {
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  ValidationError,
} from "../../lib/errors.js";

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
let registryDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-publish-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });

  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "default", path: registryDir }] }),
    "utf-8",
  );
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("publishSnippet", () => {
  it("snippet を registry にコピーする", () => {
    createSnippet("my-comp", {}, tmpDir);

    publishSnippet("my-comp", {}, tmpDir, configPath);

    expect(
      fs.existsSync(path.join(registryDir, "my-comp.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(registryDir, "my-comp")),
    ).toBe(true);
  });

  it("テンプレートファイルの内容が一致する", () => {
    createSnippet("my-comp", {}, tmpDir);

    const templateDir = path.join(tmpDir, ".mir/snippets/my-comp");
    fs.writeFileSync(
      path.join(templateDir, "index.ts"),
      "export const x = 1;",
      "utf-8",
    );

    publishSnippet("my-comp", {}, tmpDir, configPath);

    const copiedContent = fs.readFileSync(
      path.join(registryDir, "my-comp", "index.ts"),
      "utf-8",
    );
    expect(copiedContent).toBe("export const x = 1;");
  });

  it("ソースが存在しない場合にエラー", () => {
    expect(() =>
      publishSnippet("nonexistent", {}, tmpDir, configPath),
    ).toThrow(SnippetNotFoundError);
  });

  it("YAML バリデーション失敗でエラー", () => {
    const snippetsDir = path.join(tmpDir, ".mir/snippets");
    fs.mkdirSync(snippetsDir, { recursive: true });

    fs.writeFileSync(
      path.join(snippetsDir, "bad.yaml"),
      yaml.dump({ description: "no name" }),
      "utf-8",
    );
    fs.mkdirSync(path.join(snippetsDir, "bad"), { recursive: true });

    expect(() => publishSnippet("bad", {}, tmpDir, configPath)).toThrow(
      ValidationError,
    );
  });

  it("重複時にエラーを投げる", () => {
    createSnippet("dup", {}, tmpDir);
    publishSnippet("dup", {}, tmpDir, configPath);

    expect(() => publishSnippet("dup", {}, tmpDir, configPath)).toThrow(
      SnippetAlreadyExistsError,
    );
  });

  it("--force で上書きできる", () => {
    createSnippet("dup", {}, tmpDir);
    publishSnippet("dup", {}, tmpDir, configPath);

    expect(() =>
      publishSnippet("dup", { force: true }, tmpDir, configPath),
    ).not.toThrow();
  });
});
