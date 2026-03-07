/**
 * `mir init` コマンドのテスト
 * --force オプション、対話モード、ロールバック処理
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initProject } from "../../commands/init.js";
import { MirError } from "@tbsten/mir-core";

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  confirm: vi.fn(),
  prompt: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { confirm } from "../../lib/prompt.js";

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

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-init-test-"));
  vi.clearAllMocks();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// =============================================================================
// テストケース 1: --force なしで既存 .mir/ がある場合 → エラー
// =============================================================================

describe("initProject", () => {
  it("既存の .mir/ ディレクトリがあるときはエラーを投げる", async () => {
    // tmpDir に事前に .mir/ を作成
    const mirDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(mirDir, { recursive: true });
    fs.writeFileSync(path.join(mirDir, "existing-file.txt"), "old content");

    // initProject(tmpDir, { force: false, interactive: false }) を呼び出し
    await expect(
      initProject(tmpDir, { force: false, interactive: false })
    ).rejects.toThrow(MirError);
    await expect(
      initProject(tmpDir, { force: false, interactive: false })
    ).rejects.toThrow(".mir ディレクトリは既に存在します");

    // 既存ファイルが保持されていることを確認
    expect(fs.existsSync(path.join(mirDir, "existing-file.txt"))).toBe(true);
  });

  // =============================================================================
  // テストケース 2: --force で既存 .mir/ がある場合 → 上書き成功
  // =============================================================================

  it("--force で既存 .mir/ を削除して再初期化する", async () => {
    // tmpDir に事前に .mir/ を作成（古いファイルを配置）
    const mirDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(mirDir, { recursive: true });
    fs.writeFileSync(path.join(mirDir, "old-file.txt"), "old content");

    // initProject(tmpDir, { force: true }) を呼び出し
    await initProject(tmpDir, { force: true, interactive: false });

    // 新規ファイルが作成されていることを確認
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world.yaml"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world/hello.txt"))
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "mirconfig.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "README.md"))).toBe(true);

    // 古いファイルが削除されていることを確認
    expect(fs.existsSync(path.join(mirDir, "old-file.txt"))).toBe(false);
  });

  // =============================================================================
  // テストケース 3: 対話モードで確認プロンプト表示
  // =============================================================================

  it("既存ディレクトリがあるときに対話モードで確認プロンプトを表示", async () => {
    // tmpDir に事前に .mir/ を作成
    const mirDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(mirDir, { recursive: true });

    // vi.mocked(confirm).mockResolvedValue(false) で "n" をシミュレート
    vi.mocked(confirm).mockResolvedValue(false);

    // initProject(tmpDir, { force: false, interactive: true }) を呼び出し
    await initProject(tmpDir, { force: false, interactive: true });

    // confirm() が期待するメッセージで呼ばれたことをチェック
    expect(vi.mocked(confirm)).toHaveBeenCalledWith(
      "既存の .mir/ ディレクトリを削除してもよろしいですか?"
    );
  });

  // =============================================================================
  // テストケース 4: 対話確認で "y" を選択すると上書きする
  // =============================================================================

  it("対話確認で 'y' を選択すると上書きする", async () => {
    // tmpDir に事前に .mir/ を作成
    const mirDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(mirDir, { recursive: true });
    fs.writeFileSync(path.join(mirDir, "old-file.txt"), "old content");

    // vi.mocked(confirm).mockResolvedValue(true) で "y" をシミュレート
    vi.mocked(confirm).mockResolvedValue(true);

    // initProject(tmpDir, { force: false, interactive: true }) を呼び出し
    await initProject(tmpDir, { force: false, interactive: true });

    // .mir/ ディレクトリが再初期化されていることをチェック
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world.yaml"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world/hello.txt"))
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "mirconfig.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "README.md"))).toBe(true);

    // 古いファイルが削除されていることを確認
    expect(fs.existsSync(path.join(mirDir, "old-file.txt"))).toBe(false);
  });

  // =============================================================================
  // テストケース 5: 対話確認で "n" を選択するとキャンセルされ既存ディレクトリが残る
  // =============================================================================

  it("対話確認で 'n' を選択するとキャンセルされ既存ディレクトリが残る", async () => {
    // tmpDir に事前に .mir/ を作成し、特定ファイルを配置
    const mirDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(mirDir, { recursive: true });
    const existingFilePath = path.join(mirDir, "existing-file.txt");
    const existingContent = "existing content";
    fs.writeFileSync(existingFilePath, existingContent);

    // vi.mocked(confirm).mockResolvedValue(false) で "n" をシミュレート
    vi.mocked(confirm).mockResolvedValue(false);

    // initProject(tmpDir, { force: false, interactive: true }) を呼び出し
    await initProject(tmpDir, { force: false, interactive: true });

    // .mir/ の内容が変更されていないことをチェック
    expect(fs.existsSync(existingFilePath)).toBe(true);
    expect(fs.readFileSync(existingFilePath, "utf-8")).toBe(existingContent);

    // 新規ファイルは作成されていないことを確認
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world.yaml"))
    ).toBe(false);
  });

  // =============================================================================
  // テストケース 6: ロールバック: 初期化中にエラー → 既存ファイルは変更なし
  // =============================================================================

  it("初期化中にエラーが発生した場合、ロールバックされる", async () => {
    // tmpDir に事前に .mir/ を作成
    const mirDir = path.join(tmpDir, ".mir");
    fs.mkdirSync(mirDir, { recursive: true });

    // fs.writeFileSync をモックしてエラーを発生させる
    const originalWriteFileSync = fs.writeFileSync;
    let callCount = 0;
    vi.spyOn(fs, "writeFileSync").mockImplementation(
      (filePath: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions) => {
        callCount++;
        // 最初の呼び出しでエラーを発生させる
        if (callCount === 1) {
          throw new Error("Simulated write error");
        }
        return originalWriteFileSync(filePath, data, options as any);
      }
    );

    // initProject(tmpDir, { force: true }) を呼び出し
    // ロールバックされてエラーがスロー
    await expect(
      initProject(tmpDir, { force: true, interactive: false })
    ).rejects.toThrow("Simulated write error");

    // ロールバック確認: confirm が呼ばれていないことを確認
    expect(vi.mocked(confirm)).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  // =============================================================================
  // 補足: 正常系（既存ディレクトリなし）
  // =============================================================================

  it("既存ディレクトリがない場合は正常に初期化される", async () => {
    // initProject(tmpDir, { force: false, interactive: false }) を呼び出し
    await initProject(tmpDir, { force: false, interactive: false });

    // 必要なファイルが作成されていることを確認
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world.yaml"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, ".mir/snippets/hello-world/hello.txt"))
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "mirconfig.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "README.md"))).toBe(true);
  });
});
