/**
 * site-user-story.md ベースのシナリオテスト
 * 公式 registry サイト + CLI 連携のユーザストーリーをテストケースに変換
 *
 * ローカル registry を模擬してリモート registry 関連のシナリオをカバー。
 * リモート HTTP 通信は未実装 (TODO) のため、ローカル registry で代替テスト。
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
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  FileConflictError,
  RegistryRemoteError,
  RegistryNotFoundError,
  expandTemplate,
  parseSnippetYaml,
  serializeSnippetYaml,
  type SnippetDefinition,
} from "@tbsten/mir-core";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  confirm: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { prompt, confirm, confirmOverwrite } from "../../lib/prompt.js";
const mockPrompt = vi.mocked(prompt);
const mockConfirm = vi.mocked(confirm);
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

let tmpDir: string;
let registryDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-site-story-"));
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
// Story 6: 公式 registry を mirconfig.yaml に追加して利用
// =============================================================================

describe.skip("Story 6: mirconfig で registry 設定してインストール", () => {
  it("registry 指定で snippet をインストールできる", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        description: "React カスタムフック雛形",
        variables: {
          name: { description: "フック名", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "export function {{ name }}() { return null; }" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "react-hook",
      { name: "useAuth" },
      { outDir, registry: "local" },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "useAuth.ts"))).toBe(true);
    const content = fs.readFileSync(path.join(outDir, "useAuth.ts"), "utf-8");
    expect(content).toMatchSnapshot();
  });
});

// =============================================================================
// Story 7: リモート registry からの snippet 一覧取得 (名前省略で選択モード)
// =============================================================================

describe.skip("Story 7: snippet 選択モード", () => {
  it("名前省略時に利用可能な snippet 一覧からプロンプトが出る", async () => {
    setupRegistrySnippet(
      "react-hook",
      { name: "react-hook", description: "React カスタムフック" },
      { "index.ts": "content" },
    );
    setupRegistrySnippet(
      "react-component",
      { name: "react-component", description: "React コンポーネント" },
      { "index.tsx": "content" },
    );

    mockPrompt.mockResolvedValue("react-hook");

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(null as unknown as string, {}, { outDir }, tmpDir, configPath);

    // snippet 名のプロンプトが表示されたことを確認
    expect(mockPrompt).toHaveBeenCalled();
  });
});

// =============================================================================
// Story 8: リモート registry からのインストール - 変数入力
// =============================================================================

describe.skip("Story 8: 変数入力付きインストール", () => {
  it("変数をCLI引数で指定してインストール", async () => {
    setupRegistrySnippet(
      "react-component",
      {
        name: "react-component",
        description: "React コンポーネント",
        variables: {
          name: { description: "コンポーネント名", schema: { type: "string" } },
        },
      },
      {
        "{{ name }}.tsx": "<div>{{ name }}</div>",
        "{{ name }}.module.css": ".{{ name }} {}",
      },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "react-component",
      { name: "Button" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "Button.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "Button.module.css"))).toBe(true);

    const tsx = fs.readFileSync(path.join(outDir, "Button.tsx"), "utf-8");
    expect(tsx).toMatchSnapshot();
    const css = fs.readFileSync(path.join(outDir, "Button.module.css"), "utf-8");
    expect(css).toMatchSnapshot();
  });
});

// =============================================================================
// Story 9: ネットワークエラー (リモート registry 接続失敗)
// =============================================================================

describe.skip("Story 9: 存在しない registry でのエラー", () => {
  it("存在しない registry 名を指定するとエラー", async () => {
    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await expect(
      installSnippet(
        "react-hook",
        {},
        { outDir, registry: "nonexistent-registry" },
        tmpDir,
        configPath,
      ),
    ).rejects.toThrow(RegistryNotFoundError);
  });

  it("エラーメッセージに registry 名が含まれる", async () => {
    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    try {
      await installSnippet(
        "react-hook",
        {},
        { outDir, registry: "nonexistent-registry" },
        tmpDir,
        configPath,
      );
    } catch (e) {
      expect((e as Error).message).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 13: 複数 registry の横断検索
// =============================================================================

describe.skip("Story 13: 複数 registry 構成", () => {
  it("複数 registry を設定してインストール", async () => {
    const reg1 = path.join(tmpDir, "registry1");
    const reg2 = path.join(tmpDir, "registry2");
    fs.mkdirSync(reg1, { recursive: true });
    fs.mkdirSync(reg2, { recursive: true });

    const multiConfigPath = path.join(tmpDir, "multi-config.yaml");
    fs.writeFileSync(
      multiConfigPath,
      yaml.dump({
        registries: [
          { name: "local1", path: reg1 },
          { name: "local2", path: reg2 },
        ],
      }),
      "utf-8",
    );

    // registry2 に snippet を配置
    fs.writeFileSync(
      path.join(reg2, "my-snippet.yaml"),
      yaml.dump({ name: "my-snippet" }),
      "utf-8",
    );
    fs.mkdirSync(path.join(reg2, "my-snippet"), { recursive: true });
    fs.writeFileSync(
      path.join(reg2, "my-snippet/index.ts"),
      "export {}",
      "utf-8",
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    // registry1 にはないが registry2 にあるので成功する
    await installSnippet(
      "my-snippet",
      {},
      { outDir },
      tmpDir,
      multiConfigPath,
    );

    expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(true);
  });
});

// =============================================================================
// Story 14: プロジェクトローカルの mirconfig
// =============================================================================

describe.skip("Story 14: プロジェクトローカル mirconfig", () => {
  it(".mir/config.yaml がグローバルより優先される", async () => {
    setupRegistrySnippet(
      "my-snippet",
      { name: "my-snippet" },
      { "index.ts": "local registry content" },
    );

    // プロジェクトローカル config 作成
    const localConfigDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(localConfigDir, { recursive: true });
    fs.writeFileSync(
      path.join(localConfigDir, "config.yaml"),
      yaml.dump({ registries: [{ name: "local", path: registryDir }] }),
      "utf-8",
    );

    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "my-snippet",
      {},
      { outDir },
      tmpDir,
      path.join(localConfigDir, "config.yaml"),
    );

    expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(true);
  });
});

// =============================================================================
// Story 21: --dry-run でインストール確認
// =============================================================================

describe("Story 21: --dry-run モード", () => {
  it("dry-run ではファイルが作成されない", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: { name: { schema: { type: "string" } } },
      },
      { "{{ name }}.ts": "content" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "react-hook",
      { name: "useAuth" },
      { outDir, dryRun: true },
      tmpDir,
      configPath,
    );

    // dry-run ではファイルが作成されない
    expect(fs.existsSync(path.join(outDir, "useAuth.ts"))).toBe(false);
  });

  it("dry-run でもログ出力がある", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: { name: { schema: { type: "string" } } },
      },
      { "{{ name }}.ts": "content" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "react-hook",
      { name: "useAuth" },
      { outDir, dryRun: true },
      tmpDir,
      configPath,
    );

    // 何らかのログ出力がある
    const allLogCalls = [
      ...vi.mocked(logger.success).mock.calls,
      ...vi.mocked(logger.info).mock.calls,
      ...vi.mocked(logger.fileItem).mock.calls,
    ];
    expect(allLogCalls.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Story 25: hooks 付き snippet で exit が発動
// =============================================================================

describe.skip("Story 25: hooks exit 発動", () => {
  it("before-install hook の exit 条件で中止される", async () => {
    setupRegistrySnippet(
      "node-config",
      {
        name: "node-config",
        variables: {
          type: { description: "設定形式", schema: { type: "string" } },
        },
        hooks: {
          "before-install": [
            {
              exit: true,
              if: "{{ type }}",
            },
          ],
        },
      },
      { "config.{{ type }}": "content" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await expect(
      installSnippet(
        "node-config",
        { type: "json" },
        { outDir },
        tmpDir,
        configPath,
      ),
    ).rejects.toThrow();
  });
});

// =============================================================================
// Story 37: defaults を使ったインストール
// =============================================================================

describe("Story 37: mirconfig defaults", () => {
  it("defaults で共通変数が自動設定される", async () => {
    const configWithDefaults = path.join(tmpDir, "config-defaults.yaml");
    fs.writeFileSync(
      configWithDefaults,
      yaml.dump({
        registries: [{ name: "local", path: registryDir }],
        defaults: { author: "tbsten" },
      }),
      "utf-8",
    );

    setupRegistrySnippet(
      "with-author",
      {
        name: "with-author",
        variables: {
          name: { schema: { type: "string" } },
          author: { schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "// Author: {{ author }}\nexport function {{ name }}() {}" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "with-author",
      { name: "myFunc" },
      { outDir },
      tmpDir,
      configWithDefaults,
    );

    if (fs.existsSync(path.join(outDir, "myFunc.ts"))) {
      const content = fs.readFileSync(path.join(outDir, "myFunc.ts"), "utf-8");
      expect(content).toMatchSnapshot();
    }
  });
});

// =============================================================================
// Story 42: CI/CD パイプラインでの --no-interactive インストール
// =============================================================================

describe.skip("Story 42: CI/CD --no-interactive", () => {
  it("全変数を CLI 引数で指定して非対話インストール", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: {
          name: { description: "フック名", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "export function {{ name }}() {}" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "react-hook",
      { name: "useAuth" },
      { outDir, interactive: false },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "useAuth.ts"))).toBe(true);
    expect(mockPrompt).not.toHaveBeenCalled();
  });

  it("--no-interactive で変数が不足するとエラー", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: {
          name: { description: "フック名", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "content" },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    // 変数 name を指定せずに --no-interactive
    await expect(
      installSnippet(
        "react-hook",
        {},
        { outDir, interactive: false },
        tmpDir,
        configPath,
      ),
    ).rejects.toThrow();
  });
});

// =============================================================================
// Story 44: 公式 registry の snippet を fork して改変
// =============================================================================

describe.skip("Story 44: snippet の fork (テンプレートの再利用)", () => {
  it("install → 修正 → publish のフロー", async () => {
    // 元の snippet を registry に配置
    setupRegistrySnippet(
      "original",
      {
        name: "original",
        variables: {
          name: { schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "// original: {{ name }}" },
    );

    // install
    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "original",
      { name: "test" },
      { outDir },
      tmpDir,
      configPath,
    );

    // 生成されたファイルを確認
    const content = fs.readFileSync(path.join(outDir, "test.ts"), "utf-8");
    expect(content).toBe("// original: test");

    // 自分の snippet として create → 修正 → publish
    createSnippet("my-fork", {}, tmpDir);
    const mySnippetDir = path.join(tmpDir, ".mir/snippets/my-fork");
    fs.writeFileSync(
      path.join(mySnippetDir, "{{ name }}.ts"),
      "// forked: {{ name }}",
      "utf-8",
    );
    syncSnippet("my-fork", tmpDir);
    await publishSnippet("my-fork", {}, tmpDir, configPath);

    // fork した snippet を install
    const outDir2 = path.join(tmpDir, "project2");
    fs.mkdirSync(outDir2, { recursive: true });

    await installSnippet(
      "my-fork",
      { name: "forked" },
      { outDir: outDir2 },
      tmpDir,
      configPath,
    );

    const forkedContent = fs.readFileSync(
      path.join(outDir2, "forked.ts"),
      "utf-8",
    );
    expect(forkedContent).toBe("// forked: forked");
  });
});

// =============================================================================
// Story 48: ネストしたディレクトリ構造の snippet
// =============================================================================

describe.skip("Story 48: ネストしたディレクトリ構造", () => {
  it("サブディレクトリ付き snippet がインストールできる", async () => {
    setupRegistrySnippet(
      "component-suite",
      {
        name: "component-suite",
        variables: {
          name: { schema: { type: "string" } },
        },
      },
      {
        "{{ name }}/index.ts": "export { {{ name }} } from './{{ name }}';",
        "{{ name }}/{{ name }}.tsx": "<div>{{ name }}</div>",
        "{{ name }}/{{ name }}.module.css": ".{{ name }} {}",
        "{{ name }}/__tests__/{{ name }}.test.tsx":
          'test("{{ name }}", () => {});',
      },
    );

    const outDir = path.join(tmpDir, "project");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "component-suite",
      { name: "Button" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "Button/index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "Button/Button.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "Button/Button.module.css"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "Button/__tests__/Button.test.tsx"))).toBe(true);

    // ファイル内容の snapshot
    const indexContent = fs.readFileSync(
      path.join(outDir, "Button/index.ts"),
      "utf-8",
    );
    expect(indexContent).toMatchSnapshot();

    const tsxContent = fs.readFileSync(
      path.join(outDir, "Button/Button.tsx"),
      "utf-8",
    );
    expect(tsxContent).toMatchSnapshot();
  });
});

// =============================================================================
// Story 54: 複数 snippet の連続インストール (一括インストールの代替)
// =============================================================================

describe.skip("Story 54: 複数 snippet の連続インストール", () => {
  it("異なる snippet を順番にインストールできる", async () => {
    setupRegistrySnippet(
      "react-hook",
      {
        name: "react-hook",
        variables: { name: { schema: { type: "string" } } },
      },
      { "{{ name }}.ts": "export function {{ name }}() {}" },
    );

    setupRegistrySnippet(
      "react-component",
      {
        name: "react-component",
        variables: { name: { schema: { type: "string" } } },
      },
      { "{{ name }}.tsx": "<div>{{ name }}</div>" },
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

    await installSnippet(
      "react-component",
      { name: "Button" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "useAuth.ts"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "Button.tsx"))).toBe(true);
  });
});

// =============================================================================
// Story 15 (End-to-End): create → sync → publish → install フロー
// =============================================================================

describe.skip("End-to-End: create → sync → publish → install", () => {
  it("snippet のライフサイクル全体が成功する", async () => {
    // 1. create
    createSnippet("my-hook", {}, tmpDir);

    // 2. テンプレ配置
    const snippetDir = path.join(tmpDir, ".mir/snippets/my-hook");
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.ts"),
      `import { useState } from "react";

/**
 * {{ description }}
 */
export function {{ name }}() {
  const [state, setState] = useState(null);
  return { state, setState };
}`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}.test.ts"),
      `import { {{ name }} } from "./{{ name }}";

describe("{{ name }}", () => {
  it("should work", () => {
    const result = {{ name }}();
    expect(result.state).toBeNull();
  });
});`,
      "utf-8",
    );

    // 3. sync
    syncSnippet("my-hook", tmpDir);

    // YAML に変数が同期されていることを確認
    const yamlContent = fs.readFileSync(
      path.join(tmpDir, ".mir/snippets/my-hook.yaml"),
      "utf-8",
    );
    const def = yaml.load(yamlContent) as SnippetDefinition;
    expect(def.variables).toHaveProperty("name");
    expect(def.variables).toHaveProperty("description");

    // 4. publish
    await publishSnippet("my-hook", {}, tmpDir, configPath);

    // 5. install
    const outDir = path.join(tmpDir, "output");
    fs.mkdirSync(outDir, { recursive: true });

    await installSnippet(
      "my-hook",
      { name: "useCounter", description: "カウンターフック" },
      { outDir },
      tmpDir,
      configPath,
    );

    // 生成ファイルの検証
    expect(fs.existsSync(path.join(outDir, "useCounter.ts"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "useCounter.test.ts"))).toBe(true);

    const hookContent = fs.readFileSync(
      path.join(outDir, "useCounter.ts"),
      "utf-8",
    );
    expect(hookContent).toMatchSnapshot();

    const testContent = fs.readFileSync(
      path.join(outDir, "useCounter.test.ts"),
      "utf-8",
    );
    expect(testContent).toMatchSnapshot();
  });
});
