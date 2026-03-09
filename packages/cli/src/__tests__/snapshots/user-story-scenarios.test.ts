/**
 * ユーザストーリーを再現するシナリオテスト
 * .local/cli-user-story.md のストーリーに対応
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { createSnippet } from "../../commands/create.js";
import { publishSnippet } from "../../commands/publish.js";
import { installSnippet } from "../../commands/install.js";
import { syncSnippet } from "../../commands/sync.js";
import {
  ValidationError,
  SnippetAlreadyExistsError,
  SnippetNotFoundError,
  FileConflictError,
  RegistryRemoteError,
  type SnippetDefinition,
} from "@tbsten/mir-core";

// CI 環境検出をモック (テスト中は safe モードを無効化)
vi.mock("../../lib/ci-detector.js", () => ({
  isCIEnvironment: vi.fn().mockReturnValue(false),
}));

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  confirm: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { prompt, confirm, selectWithSuggests, confirmOverwrite } from "../../lib/prompt.js";
const mockPrompt = vi.mocked(prompt);
const mockConfirm = vi.mocked(confirm);
const mockConfirmOverwrite = vi.mocked(confirmOverwrite);

// logger モジュールをモック (メッセージをキャプチャ)
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

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-user-story-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });
  configPath = path.join(tmpDir, "config.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "local", path: registryDir }] }),
    "utf-8",
  );
  vi.clearAllMocks();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** registry に snippet を直接配置するヘルパー */
function setupRegistrySnippet(
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

// =============================================================================
// Story 1: 新規 snippet 作成 (create 正常系)
// =============================================================================

describe("Story 1: 新規 snippet 作成", () => {
  it("create の成功メッセージとファイル構造", () => {
    createSnippet("react-hook", {}, tmpDir);

    expect(vi.mocked(logger.success)).toHaveBeenCalledWith(
      expect.stringContaining("react-hook"),
    );
    expect(vi.mocked(logger.fileItem)).toHaveBeenCalledWith(
      expect.stringContaining(".mir/snippets/react-hook.yaml"),
    );
    expect(vi.mocked(logger.dirItem)).toHaveBeenCalledWith(
      expect.stringContaining(".mir/snippets/react-hook/"),
    );

    // ファイル構造を snapshot
    const yamlPath = path.join(tmpDir, ".mir/snippets/react-hook.yaml");
    const yamlContent = fs.readFileSync(yamlPath, "utf-8");
    expect(yamlContent).toMatchSnapshot();
  });
});

// =============================================================================
// Story 2: 無効な名前 (create 異常系)
// =============================================================================

describe("Story 2: 無効な snippet 名", () => {
  it("アンダースコア入りの名前でエラー", () => {
    expect(() => createSnippet("my_comp", {}, tmpDir)).toThrow(ValidationError);
  });

  it("エラーメッセージに名前が含まれる", () => {
    try {
      createSnippet("my_comp", {}, tmpDir);
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });

  it("先頭ハイフンでエラー", () => {
    expect(() => createSnippet("-invalid", {}, tmpDir)).toThrow(ValidationError);
  });

  it("空文字でエラー", () => {
    expect(() => createSnippet("", {}, tmpDir)).toThrow(ValidationError);
  });
});

// =============================================================================
// Story 3: 同名 snippet 既存 (create 異常系)
// =============================================================================

describe("Story 3: 同名 snippet 既存", () => {
  it("2回目の create でエラー", () => {
    createSnippet("react-hook", {}, tmpDir);
    expect(() => createSnippet("react-hook", {}, tmpDir)).toThrow(
      SnippetAlreadyExistsError,
    );
  });

  it("エラーメッセージに名前が含まれる", () => {
    createSnippet("react-hook", {}, tmpDir);
    try {
      createSnippet("react-hook", {}, tmpDir);
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 4: 初回 publish (publish 正常系)
// =============================================================================

describe("Story 4: 初回 publish", () => {
  it("publish 成功後に registry にファイルが存在する", async () => {
    // ローカル snippet 作成
    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.ts"),
      "export function {{ name }}() {}",
      "utf-8",
    );

    await publishSnippet("react-hook", { interactive: false }, tmpDir, configPath);

    expect(vi.mocked(logger.success)).toHaveBeenCalledWith(
      expect.stringContaining("react-hook"),
    );
    expect(
      fs.existsSync(path.join(registryDir, "react-hook.yaml")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(registryDir, "react-hook/{{ name }}.ts")),
    ).toBe(true);
  });
});

// =============================================================================
// Story 5: 既存 snippet 上書き publish (publish 正常系)
// =============================================================================

describe("Story 5: 上書き publish", () => {
  it("--force で上書き成功", async () => {
    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(
      path.join(snippetDir, "index.ts"),
      "v1",
      "utf-8",
    );

    await publishSnippet("react-hook", { interactive: false }, tmpDir, configPath);
    // v2 に更新
    fs.writeFileSync(
      path.join(snippetDir, "index.ts"),
      "v2",
      "utf-8",
    );

    await publishSnippet("react-hook", { force: true, interactive: false }, tmpDir, configPath);

    const content = fs.readFileSync(
      path.join(registryDir, "react-hook/index.ts"),
      "utf-8",
    );
    expect(content).toBe("v2");
  });

  it("対話確認でキャンセル", async () => {
    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(path.join(snippetDir, "index.ts"), "v1", "utf-8");

    await publishSnippet("react-hook", { interactive: false }, tmpDir, configPath);

    mockConfirm.mockResolvedValue(false);
    await publishSnippet("react-hook", {}, tmpDir, configPath);

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      expect.stringContaining("キャンセル"),
    );
  });
});

// =============================================================================
// Story 6: リモート registry への publish (publish 異常系)
// =============================================================================

describe("Story 6: リモート registry への publish", () => {
  it("リモート registry 指定でエラー", async () => {
    const remoteConfigPath = path.join(tmpDir, "remote-config.yaml");
    fs.writeFileSync(
      remoteConfigPath,
      yaml.dump({
        registries: [{ name: "team-remote", url: "https://example.com/registry" }],
      }),
      "utf-8",
    );

    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(path.join(snippetDir, "index.ts"), "content", "utf-8");

    await expect(
      publishSnippet("react-hook", { registry: "team-remote" }, tmpDir, remoteConfigPath),
    ).rejects.toThrow(RegistryRemoteError);
  });

  it("エラーメッセージ snapshot", async () => {
    const remoteConfigPath = path.join(tmpDir, "remote-config.yaml");
    fs.writeFileSync(
      remoteConfigPath,
      yaml.dump({
        registries: [{ name: "team-remote", url: "https://example.com/registry" }],
      }),
      "utf-8",
    );

    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(path.join(snippetDir, "index.ts"), "content", "utf-8");

    try {
      await publishSnippet("react-hook", { registry: "team-remote" }, tmpDir, remoteConfigPath);
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 7: 変数付き snippet の install (install 正常系)
// =============================================================================

describe("Story 7: 変数付き install", () => {
  it("CLI 引数で変数を渡して install", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: {
          name: { description: "Hook 名", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "export function {{ name }}() {}" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "react-hook",
      { name: "useAuth" },
      { outDir },
      tmpDir,
      configPath,
    );

    const generated = fs.readFileSync(
      path.join(outDir, "useAuth.ts"),
      "utf-8",
    );
    expect(generated).toMatchSnapshot();
  });
});

// =============================================================================
// Story 9: 存在しない snippet の install (install 異常系)
// =============================================================================

describe("Story 9: 存在しない snippet の install", () => {
  it("SnippetNotFoundError が発生する", async () => {
    await expect(
      installSnippet("nonexistent", {}, {}, tmpDir, configPath),
    ).rejects.toThrow(SnippetNotFoundError);
  });

  it("エラーメッセージ snapshot", async () => {
    try {
      await installSnippet("nonexistent", {}, {}, tmpDir, configPath);
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 10: 変数未入力で install (install 異常系)
// =============================================================================

describe("Story 10: 変数未入力 (空Enter)", () => {
  it("空入力で MirError が発生する", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: {
          name: { description: "Hook 名", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "content" },
    );

    mockPrompt.mockResolvedValue("");

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await expect(
      installSnippet("react-hook", {}, { outDir }, tmpDir, configPath),
    ).rejects.toThrow();
  });

  it("エラーメッセージに変数名が含まれる", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: {
          name: { description: "Hook 名", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "content" },
    );

    mockPrompt.mockResolvedValue("");

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    try {
      await installSnippet("react-hook", {}, { outDir }, tmpDir, configPath);
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 11: ファイル衝突 (install 異常系)
// =============================================================================

describe("Story 11: ファイル衝突", () => {
  it("--no-interactive で既存ファイル → FileConflictError", async () => {
    setupRegistrySnippet(
      "react-hook",
      { name: "react-hook" },
      { "index.ts": "new content" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.ts"), "existing", "utf-8");

    await expect(
      installSnippet(
        "react-hook",
        {},
        { outDir, interactive: false },
        tmpDir,
        configPath,
      ),
    ).rejects.toThrow(FileConflictError);
  });

  it("対話モードでスキップ", async () => {
    setupRegistrySnippet(
      "react-hook",
      { name: "react-hook" },
      { "index.ts": "new content" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.ts"), "existing", "utf-8");

    mockConfirmOverwrite.mockResolvedValue("no");

    await installSnippet(
      "react-hook",
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    // ファイルは変更されていない
    const content = fs.readFileSync(path.join(outDir, "index.ts"), "utf-8");
    expect(content).toBe("existing");

    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      expect.stringContaining("index.ts"),
    );
  });
});

// =============================================================================
// Story 13: テンプレートから新規変数の同期 (sync 正常系)
// =============================================================================

describe("Story 13: 新規変数の sync", () => {
  it("テンプレートに追加した変数が YAML に同期される", () => {
    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.ts"),
      "export function {{ name }}() { return {{ value }}; }",
      "utf-8",
    );

    syncSnippet("react-hook", tmpDir);

    const yamlContent = fs.readFileSync(
      path.join(tmpDir, ".mir/snippets/react-hook.yaml"),
      "utf-8",
    );
    const def = yaml.load(yamlContent) as SnippetDefinition;
    expect(def.variables).toHaveProperty("name");
    expect(def.variables).toHaveProperty("value");
    expect(def.variables!.name.schema?.type).toBe("string");
  });

  it("sync 結果のログ出力 snapshot", () => {
    createSnippet("react-hook", {}, tmpDir);
    const snippetDir = path.join(tmpDir, ".mir/snippets/react-hook");
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.ts"),
      "// {{ description }}",
      "utf-8",
    );

    vi.clearAllMocks();
    syncSnippet("react-hook", tmpDir);

    const successCalls = vi.mocked(logger.success).mock.calls;
    expect(successCalls).toMatchSnapshot();
  });
});

// =============================================================================
// Story 14: 存在しない snippet の sync (sync 異常系)
// =============================================================================

describe("Story 14: 存在しない snippet の sync", () => {
  it("SnippetNotFoundError が発生する", () => {
    expect(() => syncSnippet("nonexistent", tmpDir)).toThrow(
      SnippetNotFoundError,
    );
  });

  it("エラーメッセージ snapshot", () => {
    try {
      syncSnippet("nonexistent", tmpDir);
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 15: 初回ユーザ - .mir/ なしでのフロー
// =============================================================================

describe("Story 15: .mir/ なしでの一連フロー", () => {
  it("create → publish → install の一連が成功する", async () => {
    // 1. create
    createSnippet("hello", {}, tmpDir);

    // 2. テンプレ配置
    const snippetDir = path.join(tmpDir, ".mir/snippets/hello");
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.txt"),
      "Hello, {{ name }}!",
      "utf-8",
    );

    // 3. sync
    syncSnippet("hello", tmpDir);

    // 4. publish
    await publishSnippet("hello", { interactive: false }, tmpDir, configPath);

    // 5. install
    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "hello",
      { name: "World" },
      { outDir },
      tmpDir,
      configPath,
    );

    const generated = fs.readFileSync(
      path.join(outDir, "World.txt"),
      "utf-8",
    );
    expect(generated).toBe("Hello, World!");
  });
});
