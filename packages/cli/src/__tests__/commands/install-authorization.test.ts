import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { installSnippet } from "../../commands/install.js";
import type { SnippetDefinition } from "@tbsten/mir-core";

// CI 環境検出をモック (テスト中は safe モードを無効化)
vi.mock("../../lib/ci-detector.js", () => ({
  isCIEnvironment: vi.fn().mockReturnValue(false),
}));

// fetchRemoteSnippet をモック
vi.mock("@tbsten/mir-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tbsten/mir-core")>();
  return {
    ...actual,
    fetchRemoteSnippet: vi.fn(),
    listRemoteSnippets: vi.fn().mockResolvedValue([]),
  };
});
import { fetchRemoteSnippet } from "@tbsten/mir-core";
const mockFetchRemoteSnippet = vi.mocked(fetchRemoteSnippet);

// prompt モジュールをモック
vi.mock("../../lib/prompt.js", () => ({
  prompt: vi.fn(),
  selectWithSuggests: vi.fn(),
  confirmOverwrite: vi.fn(),
}));
import { prompt } from "../../lib/prompt.js";
const mockPrompt = vi.mocked(prompt);

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
const mockWarn = vi.mocked(logger.warn);
const mockInfo = vi.mocked(logger.info);

let tmpDir: string;
let configPath: string;
let outDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-auth-"));
  outDir = path.join(tmpDir, "out");
  fs.mkdirSync(outDir, { recursive: true });

  // リモート registry のみの config
  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "remote", url: "https://example.com" }] }),
    "utf-8",
  );

  mockPrompt.mockReset();
  mockFetchRemoteSnippet.mockReset();
  vi.mocked(logger.success).mockClear();
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.label).mockClear();
  vi.mocked(logger.fileItem).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function mockRemoteSnippet(
  def: SnippetDefinition,
  files: Record<string, string>,
  authorizationStatus?: "examination" | "approved" | "rejected",
) {
  mockFetchRemoteSnippet.mockResolvedValueOnce({
    definition: def,
    files: new Map(Object.entries(files)),
    authorizationStatus,
  });
}

describe("installSnippet: 認可ステータス", () => {
  const simpleDef: SnippetDefinition = { name: "test-snippet" };
  const simpleFiles = { "index.ts": "export const x = 1;" };

  describe("approved スニペット", () => {
    it("警告なしでインストールされる", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "approved");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: false },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("審査中"),
      );
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("却下済み"),
      );
      expect(
        fs.readFileSync(path.join(outDir, "index.ts"), "utf-8"),
      ).toBe("export const x = 1;");
    });
  });

  describe("examination スニペット", () => {
    it("警告メッセージが表示される", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");

      await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: false },
        tmpDir,
        configPath,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining("審査中"),
      );
    });

    it("インタラクティブモードで y → インストール続行", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");
      mockPrompt.mockResolvedValueOnce("y");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
      expect(mockPrompt).toHaveBeenCalledWith(
        expect.stringContaining("インストールしますか"),
      );
      expect(
        fs.readFileSync(path.join(outDir, "index.ts"), "utf-8"),
      ).toBe("export const x = 1;");
    });

    it("インタラクティブモードで yes → インストール続行", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");
      mockPrompt.mockResolvedValueOnce("yes");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
    });

    it("インタラクティブモードで N → キャンセル", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");
      mockPrompt.mockResolvedValueOnce("N");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe("AuthorizationCancelled");
      expect(fs.existsSync(path.join(outDir, "index.ts"))).toBe(false);
    });

    it("インタラクティブモードで空入力 → キャンセル", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");
      mockPrompt.mockResolvedValueOnce("");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe("AuthorizationCancelled");
    });

    it("非インタラクティブモードでは確認なしでインストール", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: false },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
      expect(mockPrompt).not.toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining("審査中"),
      );
    });

    it("quiet モードでは警告メッセージが抑制される", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: false, quiet: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("審査中"),
      );
    });

    it("json モードでは警告メッセージが抑制される", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: false, json: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("審査中"),
      );
    });
  });

  describe("rejected スニペット", () => {
    it("却下済み警告メッセージが表示される", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "rejected");

      await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: false },
        tmpDir,
        configPath,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining("却下済み"),
      );
    });

    it("インタラクティブモードで y → インストール続行", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "rejected");
      mockPrompt.mockResolvedValueOnce("y");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
    });

    it("インタラクティブモードで N → キャンセル", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "rejected");
      mockPrompt.mockResolvedValueOnce("N");

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(false);
      expect(result.code).toBe("AuthorizationCancelled");
    });
  });

  describe("authorizationStatus が undefined (ローカル registry 等)", () => {
    it("警告・確認なしでインストールされる", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, undefined);

      const result = await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(true);
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("審査中"),
      );
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("却下済み"),
      );
      expect(mockPrompt).not.toHaveBeenCalled();
    });
  });

  describe("キャンセル後の状態", () => {
    it("キャンセル時にファイルが作成されない", async () => {
      mockRemoteSnippet(
        { name: "multi-file" },
        {
          "a.ts": "export const a = 1;",
          "b.ts": "export const b = 2;",
          "sub/c.ts": "export const c = 3;",
        },
        "rejected",
      );
      mockPrompt.mockResolvedValueOnce("no");

      const result = await installSnippet(
        "multi-file",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(result.success).toBe(false);
      expect(fs.readdirSync(outDir)).toHaveLength(0);
    });

    it("キャンセル時に info ログが出力される", async () => {
      mockRemoteSnippet(simpleDef, simpleFiles, "examination");
      mockPrompt.mockResolvedValueOnce("n");

      await installSnippet(
        "test-snippet",
        {},
        { outDir, interactive: true },
        tmpDir,
        configPath,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining("キャンセル"),
      );
    });
  });
});
