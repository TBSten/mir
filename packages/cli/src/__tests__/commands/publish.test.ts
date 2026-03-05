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

vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  confirm: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { confirm } from "../../lib/prompt.js";
const mockConfirm = vi.mocked(confirm);
import * as logger from "../../lib/logger.js";

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

  mockConfirm.mockReset();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("publishSnippet", () => {
  it("snippet を registry にコピーする", async () => {
    createSnippet("my-comp", {}, tmpDir);

    await publishSnippet("my-comp", {}, tmpDir, configPath);

    expect(
      fs.existsSync(path.join(registryDir, "my-comp.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(registryDir, "my-comp")),
    ).toBe(true);
  });

  it("テンプレートファイルの内容が一致する", async () => {
    createSnippet("my-comp", {}, tmpDir);

    const templateDir = path.join(tmpDir, ".mir/snippets/my-comp");
    fs.writeFileSync(
      path.join(templateDir, "index.ts"),
      "export const x = 1;",
      "utf-8",
    );

    await publishSnippet("my-comp", {}, tmpDir, configPath);

    const copiedContent = fs.readFileSync(
      path.join(registryDir, "my-comp", "index.ts"),
      "utf-8",
    );
    expect(copiedContent).toBe("export const x = 1;");
  });

  it("ソースが存在しない場合にエラー", async () => {
    await expect(
      publishSnippet("nonexistent", {}, tmpDir, configPath),
    ).rejects.toThrow(SnippetNotFoundError);
  });

  it("YAML バリデーション失敗でエラー", async () => {
    const snippetsDir = path.join(tmpDir, ".mir/snippets");
    fs.mkdirSync(snippetsDir, { recursive: true });

    fs.writeFileSync(
      path.join(snippetsDir, "bad.yaml"),
      yaml.dump({ description: "no name" }),
      "utf-8",
    );
    fs.mkdirSync(path.join(snippetsDir, "bad"), { recursive: true });

    await expect(
      publishSnippet("bad", {}, tmpDir, configPath),
    ).rejects.toThrow(ValidationError);
  });

  it("--force で上書きできる", async () => {
    createSnippet("dup", {}, tmpDir);
    await publishSnippet("dup", {}, tmpDir, configPath);

    await expect(
      publishSnippet("dup", { force: true }, tmpDir, configPath),
    ).resolves.toBeUndefined();
  });

  it("interactive で確認して上書きできる", async () => {
    createSnippet("dup-confirm", {}, tmpDir);
    await publishSnippet("dup-confirm", {}, tmpDir, configPath);

    mockConfirm.mockResolvedValueOnce(true);

    await publishSnippet("dup-confirm", { interactive: true }, tmpDir, configPath);

    expect(mockConfirm).toHaveBeenCalled();
  });

  it("interactive で確認してキャンセルできる", async () => {
    createSnippet("dup-cancel", {}, tmpDir);
    await publishSnippet("dup-cancel", {}, tmpDir, configPath);

    mockConfirm.mockResolvedValueOnce(false);

    await publishSnippet("dup-cancel", { interactive: true }, tmpDir, configPath);

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("publish をキャンセルしました");
  });

  it("non-interactive で重複時にエラー", async () => {
    createSnippet("dup-error", {}, tmpDir);
    await publishSnippet("dup-error", {}, tmpDir, configPath);

    await expect(
      publishSnippet("dup-error", { interactive: false }, tmpDir, configPath),
    ).rejects.toThrow(SnippetAlreadyExistsError);
  });
});
