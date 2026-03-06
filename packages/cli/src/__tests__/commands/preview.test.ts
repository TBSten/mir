import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { previewSnippet, type PreviewOptions } from "../../commands/preview.js";
import {
  SnippetNotFoundError,
  type SnippetDefinition,
} from "@mir/core";

// prompt をモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { prompt, selectWithSuggests } from "../../lib/prompt.js";
const mockPrompt = vi.mocked(prompt);
const mockSelectWithSuggests = vi.mocked(selectWithSuggests);

// logger をモック
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
import * as logger from "../../lib/logger.js";

let tmpDir: string;
let registryDir: string;
let configPath: string;

function setupSnippet(
  name: string,
  def: SnippetDefinition,
  files: Record<string, string>,
): void {
  fs.writeFileSync(
    path.join(registryDir, `${name}.yaml`),
    yaml.dump(def),
    "utf-8",
  );
  const snippetDir = path.join(registryDir, name);
  fs.mkdirSync(snippetDir, { recursive: true });
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(snippetDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-preview-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });

  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "default", path: registryDir }] }),
    "utf-8",
  );

  mockPrompt.mockReset();
  mockSelectWithSuggests.mockReset();
  vi.mocked(logger.success).mockClear();
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.label).mockClear();
  vi.mocked(logger.fileItem).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("previewSnippet", () => {
  it("変数なしのプレビュー表示", async () => {
    setupSnippet("simple", { name: "simple" }, {
      "index.ts": "export const hello = 'world';",
    });

    const result = await previewSnippet("simple", {}, {}, tmpDir, configPath);

    expect(result.success).toBe(true);
    expect(result.files).toContain("index.ts");
    expect(result.files?.length).toBe(1);
  });

  it("変数ありのプレビュー表示", async () => {
    setupSnippet(
      "with-vars",
      {
        name: "with-vars",
        variables: {
          name: { schema: { type: "string", default: "myFunc" } },
        },
      },
      { "hook.ts": "export function {{ name }}() {}" },
    );

    const result = await previewSnippet(
      "with-vars",
      { output: true },
      { name: "myFunc" },
      tmpDir,
      configPath,
    );

    expect(result.success).toBe(true);
    expect(result.variables?.name).toBe("myFunc");
    expect(result.expandedContent).toBeDefined();
    expect(result.expandedContent?.["hook.ts"]).toContain("export function myFunc()");
  });

  it("存在しないスニペットでエラー", async () => {
    const promise = previewSnippet("nonexistent", {}, {}, tmpDir, configPath);
    await expect(promise).rejects.toThrow(SnippetNotFoundError);
  });

  it("対話モードで変数入力", async () => {
    setupSnippet(
      "interactive",
      {
        name: "interactive",
        variables: {
          name: { schema: { type: "string" } },
        },
      },
      { "file.ts": "export const {{ name }} = true;" },
    );

    mockPrompt.mockResolvedValue("myValue");

    const result = await previewSnippet(
      "interactive",
      {},
      {},
      tmpDir,
      configPath,
      true,
    );

    expect(result.success).toBe(true);
    expect(result.variables?.name).toBe("myValue");
  });

  it("--output オプションで拡張内容を含める", async () => {
    setupSnippet(
      "output",
      {
        name: "output",
        variables: { name: { schema: { type: "string" } } },
      },
      { "hook.ts": "export function {{ name }}() {}" },
    );

    const result = await previewSnippet(
      "output",
      { output: true },
      { name: "useAuth" },
      tmpDir,
      configPath,
    );

    expect(result.success).toBe(true);
    expect(result.expandedContent).toBeDefined();
    expect(Object.keys(result.expandedContent || {})).toContain("hook.ts");
  });
});
