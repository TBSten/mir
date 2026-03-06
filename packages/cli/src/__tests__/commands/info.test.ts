import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { showSnippetInfo } from "../../commands/info.js";
import {
  SnippetNotFoundError,
  type SnippetDefinition,
} from "@mir/core";

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));

// logger モジュールをモック
vi.mock("../../lib/logger.js", () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
  infoForOutput: vi.fn(),
  setOutputMode: vi.fn(),
}));
import * as logger from "../../lib/logger.js";
const mockInfo = vi.mocked(logger.info);
const mockStep = vi.mocked(logger.step);

// snippet-list モジュールをモック
vi.mock("../../lib/snippet-list.js", () => ({
  selectSnippet: vi.fn(),
}));
import { selectSnippet } from "../../lib/snippet-list.js";
const mockSelectSnippet = vi.mocked(selectSnippet);

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-info-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });

  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "default", path: registryDir }] }),
    "utf-8",
  );

  mockSelectSnippet.mockReset();
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.infoForOutput).mockClear();
  vi.mocked(logger.setOutputMode).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("showSnippetInfo", () => {
  it("存在する snippet の情報を表示する", async () => {
    setupSnippet("hello-world", {
      name: "hello-world",
      description: "Hello World snippet",
      variables: {
        authorName: {
          name: "Author Name",
          description: "作成者の名前",
          schema: {
            type: "string",
            default: "John Doe",
          },
        },
      },
    }, {
      "index.ts": "export const hello = 'world';",
    });

    await showSnippetInfo("hello-world", { registry: undefined }, configPath);

    // Snippet 名とセクションが表示されている
    expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining("hello-world"));
    expect(mockStep).toHaveBeenCalledWith(expect.stringContaining("Description:"));
  });

  it("存在しない snippet でエラーをスローする", async () => {
    await expect(
      showSnippetInfo("nonexistent", { registry: undefined }, configPath),
    ).rejects.toThrow(SnippetNotFoundError);
  });

  it("変数なしの snippet を表示する", async () => {
    setupSnippet("no-vars", {
      name: "no-vars",
      description: "No variables",
    }, {
      "index.ts": "export const hello = 'world';",
    });

    await showSnippetInfo("no-vars", { registry: undefined }, configPath);

    // 変数なしメッセージが表示される
    expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining("No variables"));
  });

  it("変数の default と required を表示する", async () => {
    setupSnippet("with-vars", {
      name: "with-vars",
      variables: {
        year: {
          name: "Year",
          description: "西暦年",
          schema: {
            type: "number",
            default: 2026,
          },
        },
        email: {
          name: "Email",
          description: "メールアドレス",
          schema: {
            type: "string",
          },
        },
      },
    }, {});

    await showSnippetInfo("with-vars", { registry: undefined }, configPath);

    // Variables セクションが表示される
    expect(mockStep).toHaveBeenCalledWith(expect.stringContaining("Variables"));
    // default が表示される
    expect(mockInfo).toHaveBeenCalledWith(expect.stringMatching(/default: 2026/));
    // required が表示される
    expect(mockInfo).toHaveBeenCalledWith(expect.stringMatching(/required/));
  });

  it("suggests 値を表示する", async () => {
    setupSnippet("with-suggests", {
      name: "with-suggests",
      variables: {
        authorName: {
          name: "Author",
          description: "作成者",
          schema: { type: "string" },
          suggests: ["Alice", "Bob", "Charlie"],
        },
      },
    }, {});

    await showSnippetInfo("with-suggests", { registry: undefined }, configPath);

    expect(mockInfo).toHaveBeenCalledWith(expect.stringMatching(/Options: Alice, Bob, Charlie/));
  });
});
