import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { installSnippet, parseVariableArgs, validateOutputPath, getBuiltinVariables } from "../../commands/install.js";
import {
  MirError,
  SnippetNotFoundError,
  PathTraversalError,
  FileConflictError,
  ExitHookError,
  type SnippetDefinition,
} from "@tbsten/mir-core";

// CI 環境検出をモック (テスト中は safe モードを無効化)
vi.mock("../../lib/ci-detector.js", () => ({
  isCIEnvironment: vi.fn().mockReturnValue(false),
}));

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { prompt, selectWithSuggests, confirmOverwrite } from "../../lib/prompt.js";
const mockPrompt = vi.mocked(prompt);
const mockSelectWithSuggests = vi.mocked(selectWithSuggests);
const mockConfirmOverwrite = vi.mocked(confirmOverwrite);

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
}));
import * as logger from "../../lib/logger.js";
const mockSuccess = vi.mocked(logger.success);
const mockInfo = vi.mocked(logger.info);
const mockStep = vi.mocked(logger.step);
const mockLabel = vi.mocked(logger.label);
const mockFileItem = vi.mocked(logger.fileItem);

let tmpDir: string;
let registryDir: string;
let configPath: string;
let outDir: string;

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-install-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });
  outDir = path.join(tmpDir, "out");
  fs.mkdirSync(outDir, { recursive: true });

  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "default", path: registryDir }] }),
    "utf-8",
  );

  mockPrompt.mockReset();
  mockSelectWithSuggests.mockReset();
  mockConfirmOverwrite.mockReset();
  vi.mocked(logger.success).mockClear();
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.label).mockClear();
  vi.mocked(logger.fileItem).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("installSnippet", () => {
  it("変数なしの基本インストール", async () => {
    setupSnippet("simple", { name: "simple" }, {
      "index.ts": "export const hello = 'world';",
    });

    await installSnippet("simple", {}, { outDir }, tmpDir, configPath);

    expect(
      fs.readFileSync(path.join(outDir, "index.ts"), "utf-8"),
    ).toBe("export const hello = 'world';");
  });

  it("ファイル内容の変数展開", async () => {
    setupSnippet(
      "with-vars",
      {
        name: "with-vars",
        variables: {
          name: { schema: { type: "string" } },
        },
      },
      { "hook.ts": "export function {{ name }}() {}" },
    );

    await installSnippet(
      "with-vars",
      { name: "useAuth" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(
      fs.readFileSync(path.join(outDir, "hook.ts"), "utf-8"),
    ).toBe("export function useAuth() {}");
  });

  it("ファイル名の変数展開", async () => {
    setupSnippet(
      "file-name",
      {
        name: "file-name",
        variables: { name: { schema: { type: "string" } } },
      },
      { "{{ name }}.ts": "export const {{ name }} = true;" },
    );

    await installSnippet(
      "file-name",
      { name: "myModule" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "myModule.ts"))).toBe(true);
    expect(
      fs.readFileSync(path.join(outDir, "myModule.ts"), "utf-8"),
    ).toBe("export const myModule = true;");
  });

  it("ディレクトリ名の変数展開", async () => {
    setupSnippet(
      "dir-name",
      {
        name: "dir-name",
        variables: { name: { schema: { type: "string" } } },
      },
      { [path.join("{{ name }}", "index.ts")]: "export default '{{ name }}';" },
    );

    await installSnippet(
      "dir-name",
      { name: "components" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(
      fs.readFileSync(
        path.join(outDir, "components", "index.ts"),
        "utf-8",
      ),
    ).toBe("export default 'components';");
  });

  it("複数ファイルのインストール", async () => {
    setupSnippet(
      "multi",
      {
        name: "multi",
        variables: { name: { schema: { type: "string" } } },
      },
      {
        "{{ name }}.ts": "export function {{ name }}() {}",
        "{{ name }}.test.ts": "import { {{ name }} } from './{{ name }}'",
      },
    );

    await installSnippet(
      "multi",
      { name: "useAuth" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "useAuth.ts"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "useAuth.test.ts"))).toBe(true);
  });

  it("default 値を使用する", async () => {
    setupSnippet(
      "defaults",
      {
        name: "defaults",
        variables: {
          name: { schema: { type: "string" } },
          ext: { schema: { type: "string", default: "ts" } },
        },
      },
      { "file.txt": "{{ name }}.{{ ext }}" },
    );

    await installSnippet(
      "defaults",
      { name: "test" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(
      fs.readFileSync(path.join(outDir, "file.txt"), "utf-8"),
    ).toBe("test.ts");
  });

  it("未指定の変数を interactive に入力する", async () => {
    setupSnippet(
      "interactive",
      {
        name: "interactive",
        variables: {
          name: { description: "コンポーネント名", schema: { type: "string" } },
        },
      },
      { "file.txt": "{{ name }}" },
    );

    mockPrompt.mockResolvedValueOnce("MyComponent");

    await installSnippet(
      "interactive",
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockPrompt).toHaveBeenCalledWith("コンポーネント名 (name): ");
    expect(
      fs.readFileSync(path.join(outDir, "file.txt"), "utf-8"),
    ).toBe("MyComponent");
  });

  it("interactive 入力で空文字を入力した場合エラー", async () => {
    setupSnippet(
      "interactive-empty",
      {
        name: "interactive-empty",
        variables: {
          name: { schema: { type: "string" } },
        },
      },
      { "file.txt": "{{ name }}" },
    );

    mockPrompt.mockResolvedValueOnce("");

    await expect(
      installSnippet("interactive-empty", {}, { outDir }, tmpDir, configPath),
    ).rejects.toThrow(MirError);
  });

  it("snippet が存在しない場合にエラー", async () => {
    await expect(
      installSnippet("nonexistent", {}, { outDir }, tmpDir, configPath),
    ).rejects.toThrow(SnippetNotFoundError);
  });

  it("hooks を実行する", async () => {
    setupSnippet(
      "with-hooks",
      {
        name: "with-hooks",
        hooks: {
          "before-install": [{ echo: "Before: {{ name }}" }],
          "after-install": [{ echo: "After: {{ name }}" }],
        },
        variables: { name: { schema: { type: "string" } } },
      },
      { "file.txt": "hello" },
    );

    await installSnippet(
      "with-hooks",
      { name: "test" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockInfo).toHaveBeenCalledWith("Before: test");
    expect(mockInfo).toHaveBeenCalledWith("After: test");
  });

  it("exit hook でインストールを中止する", async () => {
    setupSnippet(
      "with-exit",
      {
        name: "with-exit",
        hooks: {
          "before-install": [{ exit: true }],
        },
      },
      { "file.txt": "should not be created" },
    );

    await expect(
      installSnippet("with-exit", {}, { outDir }, tmpDir, configPath),
    ).rejects.toThrow(ExitHookError);

    expect(fs.existsSync(path.join(outDir, "file.txt"))).toBe(false);
  });

  it("変数一覧を表示する", async () => {
    setupSnippet(
      "var-display",
      {
        name: "var-display",
        variables: {
          name: { schema: { type: "string" } },
          ext: { schema: { type: "string", default: "ts" } },
        },
      },
      { "file.txt": "{{ name }}.{{ ext }}" },
    );

    await installSnippet(
      "var-display",
      { name: "test" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockInfo).toHaveBeenCalledWith('Snippet "var-display"');
    expect(mockStep).toHaveBeenCalledWith("Variables:");
    expect(mockLabel).toHaveBeenCalledWith("name", "test");
    expect(mockLabel).toHaveBeenCalledWith("ext", "ts (default)");
  });

  it("suggests がある場合 selectWithSuggests が呼ばれる", async () => {
    setupSnippet(
      "with-suggests",
      {
        name: "with-suggests",
        variables: {
          framework: {
            description: "フレームワーク",
            suggests: ["react", "vue", "svelte"],
            schema: { type: "string" },
          },
        },
      },
      { "file.txt": "{{ framework }}" },
    );

    mockSelectWithSuggests.mockResolvedValueOnce("react");

    await installSnippet(
      "with-suggests",
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockSelectWithSuggests).toHaveBeenCalledWith({
      question: "フレームワーク (framework)",
      suggests: ["react", "vue", "svelte"],
      allowManualInput: true,
      defaultValue: undefined,
    });
    expect(
      fs.readFileSync(path.join(outDir, "file.txt"), "utf-8"),
    ).toBe("react");
  });

  it("CLI 引数で指定済みなら suggests をスキップする", async () => {
    setupSnippet(
      "suggests-skip",
      {
        name: "suggests-skip",
        variables: {
          framework: {
            suggests: ["react", "vue"],
            schema: { type: "string" },
          },
        },
      },
      { "file.txt": "{{ framework }}" },
    );

    await installSnippet(
      "suggests-skip",
      { framework: "angular" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockSelectWithSuggests).not.toHaveBeenCalled();
    expect(
      fs.readFileSync(path.join(outDir, "file.txt"), "utf-8"),
    ).toBe("angular");
  });

  it("suggests + default の場合 defaultValue が渡される", async () => {
    setupSnippet(
      "suggests-default",
      {
        name: "suggests-default",
        variables: {
          framework: {
            suggests: ["react", "vue"],
            schema: { type: "string", default: "react" },
          },
        },
      },
      { "file.txt": "{{ framework }}" },
    );

    mockSelectWithSuggests.mockResolvedValueOnce("react");

    await installSnippet(
      "suggests-default",
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockSelectWithSuggests).toHaveBeenCalledWith({
      question: "framework (framework)",
      suggests: ["react", "vue"],
      allowManualInput: true,
      defaultValue: "react",
    });
  });

  it("boolean 型 + suggests の場合 allowManualInput=false", async () => {
    setupSnippet(
      "suggests-bool",
      {
        name: "suggests-bool",
        variables: {
          useTs: {
            description: "TypeScript",
            suggests: ["true", "false"],
            schema: { type: "boolean" },
          },
        },
      },
      { "file.txt": "{{ useTs }}" },
    );

    mockSelectWithSuggests.mockResolvedValueOnce("true");

    await installSnippet(
      "suggests-bool",
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(mockSelectWithSuggests).toHaveBeenCalledWith(
      expect.objectContaining({ allowManualInput: false }),
    );
  });

  it("インストール完了メッセージとファイル一覧を表示する", async () => {
    setupSnippet("simple-msg", { name: "simple-msg" }, {
      "index.ts": "hello",
    });

    await installSnippet("simple-msg", {}, { outDir }, tmpDir, configPath);

    expect(mockSuccess).toHaveBeenCalledWith(
      'Snippet "simple-msg" をインストールしました',
    );
    expect(mockFileItem).toHaveBeenCalled();
  });
});

describe("validateOutputPath", () => {
  it("正常なパスは通過する", () => {
    expect(() => validateOutputPath("src/index.ts", "/out")).not.toThrow();
  });

  it("ディレクトリトラバーサルを検出する", () => {
    expect(() => validateOutputPath("../secret.txt", "/out")).toThrow(PathTraversalError);
  });

  it("ネストされたトラバーサルを検出する", () => {
    expect(() => validateOutputPath("foo/../../secret.txt", "/out")).toThrow(PathTraversalError);
  });
});

describe("上書き保護", () => {
  it("既存ファイルがあり interactive=true のとき confirmOverwrite が呼ばれる", async () => {
    setupSnippet("overwrite-test", { name: "overwrite-test" }, {
      "existing.txt": "new content",
    });
    fs.writeFileSync(path.join(outDir, "existing.txt"), "old content", "utf-8");

    mockConfirmOverwrite.mockResolvedValueOnce("yes");

    await installSnippet("overwrite-test", {}, { outDir, interactive: true }, tmpDir, configPath);

    expect(mockConfirmOverwrite).toHaveBeenCalledWith("existing.txt");
    expect(fs.readFileSync(path.join(outDir, "existing.txt"), "utf-8")).toBe("new content");
  });

  it("confirmOverwrite で no を選択するとスキップされる", async () => {
    setupSnippet("overwrite-skip", { name: "overwrite-skip" }, {
      "existing.txt": "new content",
    });
    fs.writeFileSync(path.join(outDir, "existing.txt"), "old content", "utf-8");

    mockConfirmOverwrite.mockResolvedValueOnce("no");

    await installSnippet("overwrite-skip", {}, { outDir, interactive: true }, tmpDir, configPath);

    expect(fs.readFileSync(path.join(outDir, "existing.txt"), "utf-8")).toBe("old content");
  });

  it("non-interactive で既存ファイルがある場合エラー", async () => {
    setupSnippet("overwrite-error", { name: "overwrite-error" }, {
      "existing.txt": "new content",
    });
    fs.writeFileSync(path.join(outDir, "existing.txt"), "old content", "utf-8");

    await expect(
      installSnippet("overwrite-error", {}, { outDir, interactive: false }, tmpDir, configPath),
    ).rejects.toThrow(FileConflictError);
  });

  it("confirmOverwrite で all を選択すると以降の確認をスキップする", async () => {
    setupSnippet("overwrite-all", { name: "overwrite-all" }, {
      "a.txt": "new-a",
      "b.txt": "new-b",
    });
    fs.writeFileSync(path.join(outDir, "a.txt"), "old-a", "utf-8");
    fs.writeFileSync(path.join(outDir, "b.txt"), "old-b", "utf-8");

    mockConfirmOverwrite.mockResolvedValueOnce("all");

    await installSnippet("overwrite-all", {}, { outDir, interactive: true }, tmpDir, configPath);

    expect(mockConfirmOverwrite).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync(path.join(outDir, "a.txt"), "utf-8")).toBe("new-a");
    expect(fs.readFileSync(path.join(outDir, "b.txt"), "utf-8")).toBe("new-b");
  });
});

describe("getBuiltinVariables", () => {
  it("package.json から project-name を取得する", () => {
    const projDir = path.join(tmpDir, "my-project");
    fs.mkdirSync(projDir, { recursive: true });
    fs.writeFileSync(
      path.join(projDir, "package.json"),
      JSON.stringify({ name: "my-awesome-project" }),
      "utf-8",
    );
    const vars = getBuiltinVariables(projDir);
    expect(vars["project-name"]).toBe("my-awesome-project");
  });

  it("package.json がない場合はディレクトリ名を使う", () => {
    const projDir = path.join(tmpDir, "fallback-project");
    fs.mkdirSync(projDir, { recursive: true });
    const vars = getBuiltinVariables(projDir);
    expect(vars["project-name"]).toBe("fallback-project");
  });

  it("{{ project-name }} がテンプレートで展開される", async () => {
    setupSnippet("proj-name", { name: "proj-name" }, {
      "readme.txt": "Project: {{ project-name }}",
    });

    await installSnippet("proj-name", {}, { outDir }, tmpDir, configPath);

    const content = fs.readFileSync(path.join(outDir, "readme.txt"), "utf-8");
    expect(content).toContain("Project: ");
    expect(content).not.toContain("{{ project-name }}");
  });

  it("CLI 引数で project-name を上書きできる", async () => {
    setupSnippet("proj-override", { name: "proj-override" }, {
      "readme.txt": "Project: {{ project-name }}",
    });

    await installSnippet(
      "proj-override",
      { "project-name": "custom-name" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(
      fs.readFileSync(path.join(outDir, "readme.txt"), "utf-8"),
    ).toBe("Project: custom-name");
  });
});

describe("parseVariableArgs", () => {
  it("--key=value 形式をパースする", () => {
    expect(parseVariableArgs(["--name=MyComponent", "--ext=tsx"])).toEqual({
      name: "MyComponent",
      ext: "tsx",
    });
  });

  it("不正な形式を無視する", () => {
    expect(parseVariableArgs(["--name=test", "invalid", "--foo"])).toEqual({
      name: "test",
    });
  });

  it("空配列で空オブジェクトを返す", () => {
    expect(parseVariableArgs([])).toEqual({});
  });
});
