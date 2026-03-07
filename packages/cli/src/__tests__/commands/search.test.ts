import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { searchSnippets } from "../../commands/search.js";

// logger をモック
vi.mock("../../lib/logger.js", () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
  infoForOutput: vi.fn(),
}));
import * as logger from "../../lib/logger.js";

// mirconfig をモック
vi.mock("../../lib/mirconfig.js", async () => {
  const actual = await vi.importActual<typeof import("../../lib/mirconfig.js")>("../../lib/mirconfig.js");
  return {
    ...actual,
    loadMirConfig: vi.fn(() => testConfig),
  };
});
import * as mirconfig from "../../lib/mirconfig.js";

// remote-registry と registry をモック
vi.mock("@tbsten/mir-core", async () => {
  const actual = await vi.importActual<any>("@tbsten/mir-core");
  return {
    ...actual,
    listRemoteSnippets: vi.fn(async (baseUrl: string) => {
      return remoteSnippets[baseUrl] || [];
    }),
    listRegistrySnippets: vi.fn((regPath: string) => {
      return localSnippets[regPath] || [];
    }),
  };
});

let tmpDir: string;
let registryDir: string;
let testConfig: any;
let localSnippets: Record<string, string[]> = {};
let remoteSnippets: Record<string, string[]> = {};
let remoteSearchResults: Record<string, string[]> = {};

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-search-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });

  testConfig = { registries: [{ name: "default", path: registryDir }] };

  localSnippets = {
    [registryDir]: ["hello-world", "react-component", "vue-hook"],
  };

  remoteSnippets = {
    "https://example.com/registry": ["hello-world", "react-component", "vue-hook", "svelte-store"],
  };

  remoteSearchResults = {};

  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.fileItem).mockClear();
  vi.mocked(logger.infoForOutput).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  localSnippets = {};
  remoteSnippets = {};
  remoteSearchResults = {};
});

describe("searchSnippets", () => {
  it("ローカル registry でキーワード検索できる（人間向け出力）", async () => {
    await searchSnippets("react", { registry: "default", json: false, quiet: false });

    // fileItem が呼ばれて、検索結果が表示されること
    expect(vi.mocked(logger.fileItem)).toHaveBeenCalled();
  });

  it("--json オプションで JSON 形式で出力される", async () => {
    await searchSnippets("react", { registry: "default", json: true, quiet: false });

    expect(vi.mocked(logger.infoForOutput)).toHaveBeenCalled();

    const callArg = vi.mocked(logger.infoForOutput).mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    expect(typeof callArg).toBe("object");
  });

  it("検索結果がない場合、警告を表示", async () => {
    localSnippets[registryDir] = ["hello-world"];
    remoteSearchResults = {};

    await searchSnippets("nonexistent", { registry: "default", json: false, quiet: false });

    expect(vi.mocked(logger.warn)).toHaveBeenCalled();
  });

  it("--quiet オプションで人間向けログが抑制される", async () => {
    await searchSnippets("react", { registry: "default", json: false, quiet: true });

    expect(vi.mocked(logger.info)).not.toHaveBeenCalled();
    expect(vi.mocked(logger.fileItem)).not.toHaveBeenCalled();
  });

  it("大文字小文字を区別しない検索が行われる", async () => {
    // REACT でも react でも同じ結果が得られることを確認
    // （実装側で toLowerCase で比較）
    await searchSnippets("REACT", { registry: "default", json: false, quiet: false });

    // 結果が表示されていることを確認
    expect(vi.mocked(logger.step)).toHaveBeenCalled();
  });
});
