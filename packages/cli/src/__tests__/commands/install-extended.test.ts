import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import {
  installSnippet,
  parseVariableArgs,
  parseSnippetNames,
  parseSnippetNamesFromFile,
  runBatchInstall,
  type InstallOptions,
} from "../../commands/install.js";
import {
  MirError,
  SnippetNotFoundError,
  type SnippetDefinition,
} from "@tbsten/mir-core";

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { prompt, confirmOverwrite } from "../../lib/prompt.js";
const mockPrompt = vi.mocked(prompt);
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
const mockWarn = vi.mocked(logger.warn);

// CI 環境検出をモック（テスト中は CI と判定しないように）
vi.mock("../../lib/ci-detector.js", () => ({
  isCIEnvironment: vi.fn().mockReturnValue(false),
}));
import { isCIEnvironment } from "../../lib/ci-detector.js";
const mockIsCIEnvironment = vi.mocked(isCIEnvironment);

// process.exit をモック
const mockProcessExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);

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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-install-ext-"));
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
  mockConfirmOverwrite.mockReset();
  vi.mocked(logger.success).mockClear();
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.error).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.label).mockClear();
  vi.mocked(logger.fileItem).mockClear();
  mockProcessExit.mockClear();

  // デフォルトでは CI 環境ではないと判定
  mockIsCIEnvironment.mockReturnValue(false);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// =========================================
// --json オプション
// =========================================
describe("--json オプション", () => {
  it("installSnippet が InstallResult を返す（成功時）", async () => {
    setupSnippet("simple", { name: "simple" }, {
      "index.ts": "export const hello = 'world';",
    });

    const result = await installSnippet("simple", {}, { outDir }, tmpDir, configPath);

    expect(result.success).toBe(true);
    expect(result.snippet).toBe("simple");
    expect(result.files).toBeDefined();
    expect(Array.isArray(result.files)).toBe(true);
    expect(result.outDir).toBeDefined();
  });

  it("installSnippet が変数情報を含む InstallResult を返す", async () => {
    setupSnippet(
      "with-vars",
      {
        name: "with-vars",
        variables: {
          name: { schema: { type: "string" } },
        },
      },
      { "index.ts": "// {{ name }}" },
    );

    const result = await installSnippet(
      "with-vars",
      { name: "MyModule" },
      { outDir },
      tmpDir,
      configPath,
    );

    expect(result.success).toBe(true);
    expect(result.variables).toBeDefined();
    expect(result.variables?.name).toBe("MyModule");
  });

  it("dry-run 時も InstallResult を返す", async () => {
    setupSnippet("dry-run-test", { name: "dry-run-test" }, {
      "index.ts": "hello",
    });

    const result = await installSnippet(
      "dry-run-test",
      {},
      { outDir, dryRun: true },
      tmpDir,
      configPath,
    );

    expect(result.success).toBe(true);
    expect(result.files).toBeDefined();
    // dry-run ではファイルが実際に作成されない
    expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(false);
  });
});

// =========================================
// --quiet オプション
// =========================================
describe("--quiet オプション", () => {
  it("--quiet でログを抑制する", async () => {
    setupSnippet("quiet-test", { name: "quiet-test" }, {
      "index.ts": "hello",
    });

    await installSnippet("quiet-test", {}, { outDir, quiet: true }, tmpDir, configPath);

    expect(mockSuccess).not.toHaveBeenCalled();
    expect(mockInfo).not.toHaveBeenCalled();
  });

  it("--quiet でも hooks が実行される（ログなし）", async () => {
    setupSnippet(
      "quiet-hooks",
      {
        name: "quiet-hooks",
        hooks: {
          "before-install": [{ echo: "Before install" }],
          "after-install": [{ echo: "After install" }],
        },
      },
      { "index.ts": "hello" },
    );

    await installSnippet("quiet-hooks", {}, { outDir, quiet: true }, tmpDir, configPath);

    // quiet モードではログを出力しない
    expect(mockInfo).not.toHaveBeenCalledWith("Before install");
    expect(mockInfo).not.toHaveBeenCalledWith("After install");
    // ファイルは作成される
    expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(true);
  });
});

// =========================================
// --dry-run オプション
// =========================================
describe("--dry-run オプション", () => {
  it("--dry-run でファイルが作成されない", async () => {
    setupSnippet("dry-test", { name: "dry-test" }, {
      "index.ts": "export const hello = 'world';",
    });

    await installSnippet("dry-test", {}, { outDir, dryRun: true }, tmpDir, configPath);

    expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(false);
  });

  it("--dry-run でファイル一覧が表示される", async () => {
    setupSnippet("dry-list", { name: "dry-list" }, {
      "index.ts": "hello",
    });

    await installSnippet("dry-list", {}, { outDir, dryRun: true }, tmpDir, configPath);

    expect(vi.mocked(logger.fileItem)).toHaveBeenCalled();
  });

  it("--dry-run で before-install hooks が実行される", async () => {
    setupSnippet(
      "dry-hooks",
      {
        name: "dry-hooks",
        hooks: {
          "before-install": [{ echo: "Before dry-run" }],
        },
      },
      { "index.ts": "hello" },
    );

    await installSnippet("dry-hooks", {}, { outDir, dryRun: true }, tmpDir, configPath);

    // before-install hooks は dry-run でも実行される
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("Before dry-run");
    // ファイルは作成されない
    expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(false);
  });

  it("--dry-run で after-install hooks が実行されない", async () => {
    setupSnippet(
      "dry-after-hooks",
      {
        name: "dry-after-hooks",
        hooks: {
          "after-install": [{ echo: "After dry-run - should not appear" }],
        },
      },
      { "index.ts": "hello" },
    );

    await installSnippet("dry-after-hooks", {}, { outDir, dryRun: true }, tmpDir, configPath);

    expect(vi.mocked(logger.info)).not.toHaveBeenCalledWith("After dry-run - should not appear");
  });
});

// =========================================
// --safe オプション
// =========================================
describe("--safe オプション", () => {
  it("--safe でファイルの上書きをスキップする", async () => {
    setupSnippet("safe-overwrite", { name: "safe-overwrite" }, {
      "existing.txt": "new content",
    });
    fs.writeFileSync(path.join(outDir, "existing.txt"), "old content", "utf-8");

    const result = await installSnippet(
      "safe-overwrite",
      {},
      { outDir, safe: true },
      tmpDir,
      configPath,
    );

    // safe モードではスキップ（上書きしない）
    expect(fs.readFileSync(path.join(outDir, "existing.txt"), "utf-8")).toBe("old content");
    expect(result.success).toBe(true);
  });

  it("--safe で hooks を実行しない", async () => {
    setupSnippet(
      "safe-hooks",
      {
        name: "safe-hooks",
        hooks: {
          "before-install": [{ echo: "Before hook" }],
          "after-install": [{ echo: "After hook" }],
        },
      },
      { "index.ts": "hello" },
    );

    await installSnippet("safe-hooks", {}, { outDir, safe: true }, tmpDir, configPath);

    expect(vi.mocked(logger.info)).not.toHaveBeenCalledWith("Before hook");
    expect(vi.mocked(logger.info)).not.toHaveBeenCalledWith("After hook");
  });

  it("--safe 時に hooks スキップの警告を表示する", async () => {
    setupSnippet(
      "safe-hooks-warn",
      {
        name: "safe-hooks-warn",
        hooks: {
          "before-install": [{ echo: "Hook output" }],
        },
      },
      { "index.ts": "hello" },
    );

    await installSnippet("safe-hooks-warn", {}, { outDir, safe: true }, tmpDir, configPath);

    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining("[safe]"));
  });

  it("--safe で新規ファイルは作成される", async () => {
    setupSnippet("safe-new", { name: "safe-new" }, {
      "new-file.ts": "export const hello = true;",
    });

    await installSnippet("safe-new", {}, { outDir, safe: true }, tmpDir, configPath);

    expect(fs.existsSync(path.join(outDir, "new-file.ts"))).toBe(true);
  });

  it("CI 環境では自動的に safe モードが有効になる", async () => {
    mockIsCIEnvironment.mockReturnValue(true);

    setupSnippet(
      "ci-hooks",
      {
        name: "ci-hooks",
        hooks: {
          "before-install": [{ echo: "CI hook output" }],
        },
      },
      { "index.ts": "hello" },
    );

    await installSnippet(
      "ci-hooks",
      {},
      { outDir }, // safe オプション指定なし
      tmpDir,
      configPath,
    );

    // CI 環境では hooks はスキップされる
    expect(vi.mocked(logger.info)).not.toHaveBeenCalledWith("CI hook output");
  });
});

// =========================================
// シンボリックリンク対策
// =========================================
describe("シンボリックリンク対策", () => {
  it("safe モードでシンボリックリンクがある場合エラーになる", async () => {
    setupSnippet("symlink-safe", { name: "symlink-safe" }, {
      "index.ts": "hello",
    });

    // シンボリックリンクを追加
    const snippetDir = path.join(registryDir, "symlink-safe");
    const targetPath = path.join(tmpDir, "sensitive-file.txt");
    fs.writeFileSync(targetPath, "sensitive data");
    fs.symlinkSync(targetPath, path.join(snippetDir, "evil-link.txt"));

    await expect(
      installSnippet("symlink-safe", {}, { outDir, safe: true }, tmpDir, configPath),
    ).rejects.toThrow(MirError);
  });

  it("通常モードでシンボリックリンクがある場合警告のみ", async () => {
    setupSnippet("symlink-warn", { name: "symlink-warn" }, {
      "index.ts": "hello",
    });

    // シンボリックリンクを追加
    const snippetDir = path.join(registryDir, "symlink-warn");
    const targetPath = path.join(tmpDir, "target.txt");
    fs.writeFileSync(targetPath, "target content");
    fs.symlinkSync(targetPath, path.join(snippetDir, "link.txt"));

    await installSnippet("symlink-warn", {}, { outDir }, tmpDir, configPath);

    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining("link.txt"));
  });
});

// =========================================
// バッチインストール
// =========================================
describe("バッチインストール", () => {
  it("複数 snippet を順番にインストールする", async () => {
    setupSnippet("batch-a", { name: "batch-a" }, {
      "a.txt": "content-a",
    });
    setupSnippet("batch-b", { name: "batch-b" }, {
      "b.txt": "content-b",
    });

    await runBatchInstall(
      ["batch-a", "batch-b"],
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "a.txt"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "b.txt"))).toBe(true);
  });

  it("一部の snippet が存在しない場合でも残りをインストールする", async () => {
    setupSnippet("batch-exists", { name: "batch-exists" }, {
      "exists.txt": "content",
    });

    // 一部失敗時は process.exit(1) が呼ばれる
    await runBatchInstall(
      ["batch-exists", "batch-nonexistent"],
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "exists.txt"))).toBe(true);
    // 失敗した snippet があるので process.exit(1) が呼ばれる
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});

// =========================================
// parseSnippetNames
// =========================================
describe("parseSnippetNames", () => {
  it("スニペット名の配列をそのまま返す", () => {
    expect(parseSnippetNames(["snippet-a", "snippet-b"])).toEqual([
      "snippet-a",
      "snippet-b",
    ]);
  });

  it("--key=value 形式の引数を除外する", () => {
    expect(parseSnippetNames(["snippet-a", "--name=foo"])).toEqual([
      "snippet-a",
    ]);
  });

  it("空文字列を除外する", () => {
    expect(parseSnippetNames(["", "snippet-a", ""])).toEqual(["snippet-a"]);
  });

  it("空配列を返す（引数なし）", () => {
    expect(parseSnippetNames([])).toEqual([]);
  });
});

// =========================================
// parseSnippetNamesFromFile
// =========================================
describe("parseSnippetNamesFromFile", () => {
  it("ファイルから改行区切りで snippet 名を読み込む", () => {
    const filePath = path.join(tmpDir, "snippets.txt");
    fs.writeFileSync(
      filePath,
      "snippet-a\nsnippet-b\nsnippet-c\n",
      "utf-8",
    );

    expect(parseSnippetNamesFromFile(filePath)).toEqual([
      "snippet-a",
      "snippet-b",
      "snippet-c",
    ]);
  });

  it("ファイルからカンマ区切りで snippet 名を読み込む", () => {
    const filePath = path.join(tmpDir, "snippets-comma.txt");
    fs.writeFileSync(
      filePath,
      "snippet-a,snippet-b,snippet-c",
      "utf-8",
    );

    expect(parseSnippetNamesFromFile(filePath)).toEqual([
      "snippet-a",
      "snippet-b",
      "snippet-c",
    ]);
  });

  it("混合区切り（改行とカンマ）に対応", () => {
    const filePath = path.join(tmpDir, "snippets-mixed.txt");
    fs.writeFileSync(
      filePath,
      "snippet-a,snippet-b\nsnippet-c,snippet-d\n",
      "utf-8",
    );

    expect(parseSnippetNamesFromFile(filePath)).toEqual([
      "snippet-a",
      "snippet-b",
      "snippet-c",
      "snippet-d",
    ]);
  });

  it("コメント行（#で始まる行）をスキップ", () => {
    const filePath = path.join(tmpDir, "snippets-comment.txt");
    fs.writeFileSync(
      filePath,
      "# This is a comment\nsnippet-a\n# Another comment\nsnippet-b",
      "utf-8",
    );

    expect(parseSnippetNamesFromFile(filePath)).toEqual([
      "snippet-a",
      "snippet-b",
    ]);
  });

  it("空行と空白をトリム", () => {
    const filePath = path.join(tmpDir, "snippets-whitespace.txt");
    fs.writeFileSync(
      filePath,
      "  snippet-a  \n\n  snippet-b  \n",
      "utf-8",
    );

    expect(parseSnippetNamesFromFile(filePath)).toEqual([
      "snippet-a",
      "snippet-b",
    ]);
  });

  it("ファイルが存在しない場合エラーをスロー", () => {
    const filePath = path.join(tmpDir, "nonexistent.txt");

    expect(() => parseSnippetNamesFromFile(filePath)).toThrow();
  });
});

// =========================================
// タイムアウトオプション
// =========================================
describe("タイムアウトオプション", () => {
  it("timeout オプションが正常に受け取られる（ローカル registry では無視）", async () => {
    setupSnippet("timeout-test", { name: "timeout-test" }, {
      "index.ts": "hello",
    });

    // ローカル registry なのでタイムアウトは使われないが、エラーが出ないことを確認
    const result = await installSnippet(
      "timeout-test",
      {},
      { outDir, timeout: 30 },
      tmpDir,
      configPath,
    );

    expect(result.success).toBe(true);
  });
});

// =========================================
// --skip-errors オプション
// =========================================
describe("--skip-errors オプション", () => {
  it("skipErrors=true で一部失敗しても続行する", async () => {
    setupSnippet("skip-exists", { name: "skip-exists" }, {
      "exists.txt": "content",
    });
    setupSnippet("skip-exists2", { name: "skip-exists2" }, {
      "exists2.txt": "content2",
    });

    // skipErrors=true でエラーをスキップ
    await runBatchInstall(
      ["skip-exists", "skip-nonexistent", "skip-exists2"],
      {},
      { outDir, skipErrors: true },
      tmpDir,
      configPath,
    );

    // 存在するスニペットはインストールされる
    expect(fs.existsSync(path.join(outDir, "exists.txt"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "exists2.txt"))).toBe(true);
  });

  it("skipErrors=false（デフォルト）で最初のエラーで停止", async () => {
    setupSnippet("skip-first", { name: "skip-first" }, {
      "first.txt": "content",
    });

    // skipErrors を指定しない場合、最初のエラーで process.exit(1) が呼ばれる
    // mockProcessExit が呼ばれるため promise は resolve される（exit() が呼ばれるため）
    await runBatchInstall(
      ["skip-first", "skip-nonexistent"],
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    // 最初のスニペットはインストールされる
    expect(fs.existsSync(path.join(outDir, "first.txt"))).toBe(true);
    // process.exit(1) が呼ばれる
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});

// =========================================
// --file オプション連携テスト
// =========================================
describe("--file オプション連携", () => {
  it("--file で指定されたファイルから snippet 名を読み込んでインストール", async () => {
    setupSnippet("file-a", { name: "file-a" }, {
      "a.txt": "content-a",
    });
    setupSnippet("file-b", { name: "file-b" }, {
      "b.txt": "content-b",
    });

    const snippetsFile = path.join(tmpDir, "snippets.txt");
    fs.writeFileSync(
      snippetsFile,
      "file-a\nfile-b",
      "utf-8",
    );

    await runBatchInstall(
      parseSnippetNamesFromFile(snippetsFile),
      {},
      { outDir },
      tmpDir,
      configPath,
    );

    expect(fs.existsSync(path.join(outDir, "a.txt"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "b.txt"))).toBe(true);
  });

  it("CLI 引数と --file オプションをマージ", async () => {
    setupSnippet("cli-snippet", { name: "cli-snippet" }, {
      "cli.txt": "from-cli",
    });
    setupSnippet("file-snippet", { name: "file-snippet" }, {
      "file.txt": "from-file",
    });

    const snippetsFile = path.join(tmpDir, "snippets.txt");
    fs.writeFileSync(snippetsFile, "file-snippet", "utf-8");

    const cliNames = parseSnippetNames(["cli-snippet"]);
    const fileNames = parseSnippetNamesFromFile(snippetsFile);
    const merged = [...cliNames, ...fileNames];

    await runBatchInstall(merged, {}, { outDir }, tmpDir, configPath);

    expect(fs.existsSync(path.join(outDir, "cli.txt"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "file.txt"))).toBe(true);
  });
});
