import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { cloneSnippet } from "../../commands/clone.js";

// logger をモック
vi.mock("../../lib/logger.js", () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  success: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
  infoForOutput: vi.fn(),
}));
import * as logger from "../../lib/logger.js";

let tmpDir: string;
let snippetsDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-clone-"));
  snippetsDir = path.join(tmpDir, ".mir", "snippets");
  fs.mkdirSync(snippetsDir, { recursive: true });

  vi.mocked(logger.success).mockClear();
  vi.mocked(logger.error).mockClear();
  vi.mocked(logger.fileItem).mockClear();
  vi.mocked(logger.dirItem).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupSnippet(name: string, description: string = "Test snippet"): void {
  const yamlPath = path.join(snippetsDir, `${name}.yaml`);
  const snippetDir = path.join(snippetsDir, name);

  fs.writeFileSync(
    yamlPath,
    yaml.dump({
      name,
      description,
      variables: { testVar: { name: "Test Variable", description: "A test variable" } },
      hooks: {
        "before-install": [],
        "after-install": [],
      },
    }),
    "utf-8",
  );

  fs.mkdirSync(snippetDir, { recursive: true });
  fs.writeFileSync(path.join(snippetDir, "test.txt"), "Test content", "utf-8");
}

describe("cloneSnippet", () => {
  it("snippet を複製できる（同じ名前でコピー）", () => {
    setupSnippet("hello-world");

    cloneSnippet("hello-world", {}, tmpDir);

    // 新しいディレクトリが作成されていることを確認
    const clonedYamlPath = path.join(snippetsDir, "hello-world-copy.yaml");
    expect(fs.existsSync(clonedYamlPath)).toBe(true);

    // YAML の内容を確認
    const content = fs.readFileSync(clonedYamlPath, "utf-8");
    const def = yaml.load(content) as any;
    expect(def.name).toBe("hello-world-copy");
  });

  it("snippet をエイリアスで複製できる", () => {
    setupSnippet("hello-world");

    cloneSnippet("hello-world", { alias: "my-hello" }, tmpDir);

    const clonedYamlPath = path.join(snippetsDir, "my-hello.yaml");
    expect(fs.existsSync(clonedYamlPath)).toBe(true);

    const content = fs.readFileSync(clonedYamlPath, "utf-8");
    const def = yaml.load(content) as any;
    expect(def.name).toBe("my-hello");
  });

  it("複製されたファイルの内容が保存されている", () => {
    setupSnippet("hello-world");

    cloneSnippet("hello-world", { alias: "my-hello" }, tmpDir);

    const clonedDir = path.join(snippetsDir, "my-hello");
    const testFile = path.join(clonedDir, "test.txt");
    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.readFileSync(testFile, "utf-8")).toBe("Test content");
  });

  it("既存の snippet 名を指定するとエラーが発生", () => {
    setupSnippet("hello-world");
    setupSnippet("existing-snippet");

    expect(() => {
      cloneSnippet("hello-world", { alias: "existing-snippet" }, tmpDir);
    }).toThrow();
  });

  it("存在しない snippet を複製しようとするとエラーが発生", () => {
    expect(() => {
      cloneSnippet("nonexistent", {}, tmpDir);
    }).toThrow();
  });

  it("成功時に logger.success が呼ばれる", () => {
    setupSnippet("hello-world");

    cloneSnippet("hello-world", { alias: "my-hello" }, tmpDir);

    expect(vi.mocked(logger.success)).toHaveBeenCalled();
  });

  it("変数が保存される", () => {
    setupSnippet("hello-world");

    cloneSnippet("hello-world", { alias: "my-hello" }, tmpDir);

    const clonedYamlPath = path.join(snippetsDir, "my-hello.yaml");
    const content = fs.readFileSync(clonedYamlPath, "utf-8");
    const def = yaml.load(content) as any;

    expect(def.variables).toBeDefined();
    expect(def.variables.testVar).toBeDefined();
    expect(def.variables.testVar.name).toBe("Test Variable");
  });
});
