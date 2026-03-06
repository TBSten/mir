import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { listSnippets } from "../../commands/list.js";

// logger モジュールをモック
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

let tmpDir: string;
let registryDir: string;
let configPath: string;
let testConfig: any;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-list-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });

  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "default", path: registryDir }] }),
    "utf-8",
  );

  // テスト用の config オブジェクトを作成
  testConfig = { registries: [{ name: "default", path: registryDir }] };

  // logger モックをリセット
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.step).mockClear();
  vi.mocked(logger.fileItem).mockClear();
  vi.mocked(logger.infoForOutput).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function setupSnippet(name: string): void {
  const snippetDefPath = path.join(registryDir, `${name}.yaml`);
  fs.writeFileSync(
    snippetDefPath,
    yaml.dump({ name }),
    "utf-8",
  );
  const snippetDir = path.join(registryDir, name);
  fs.mkdirSync(snippetDir, { recursive: true });
}

describe("listSnippets", () => {
  it("複数 snippet がある場合、全て表示される（人間向け出力）", async () => {
    setupSnippet("hello-world");
    setupSnippet("vue-component");

    await listSnippets({ registry: "default", json: false, yaml: false, quiet: false });

    // logger.step が呼ばれて、logger.fileItem で各 snippet が表示されること
    expect(vi.mocked(logger.step)).toHaveBeenCalled();
    const fileItemCalls = vi.mocked(logger.fileItem).mock.calls;
    expect(fileItemCalls.length).toBe(2);
    expect(fileItemCalls.map(c => c[0])).toContain("hello-world");
    expect(fileItemCalls.map(c => c[0])).toContain("vue-component");

    // JSON 出力はされていない
    expect(vi.mocked(logger.infoForOutput)).not.toHaveBeenCalled();
  });

  it("registry に snippet がない場合、警告を表示", async () => {
    await listSnippets({ registry: "default", json: false, yaml: false, quiet: false });

    // registry は存在するが snippet がない場合、"snippet がありません" メッセージが表示される
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(expect.stringContaining("snippet がありません"));
  });

  it("--json オプションで JSON 形式で出力される", async () => {
    setupSnippet("hello-world");
    setupSnippet("vue-component");

    await listSnippets({ registry: "default", json: true, yaml: false, quiet: false });

    // logger.infoForOutput が呼ばれること
    expect(vi.mocked(logger.infoForOutput)).toHaveBeenCalled();

    // 呼ばれた引数がオブジェクトで、registries 配列を持つことを確認
    const callArg = vi.mocked(logger.infoForOutput).mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    expect(typeof callArg).toBe("object");
    const data = callArg as any;
    expect(Array.isArray(data.registries)).toBe(true);
    expect(data.registries.length).toBeGreaterThan(0);
    expect(data.registries[0].snippets).toEqual(["hello-world", "vue-component"]);

    // 人間向け出力は抑制される
    expect(vi.mocked(logger.fileItem)).not.toHaveBeenCalled();
  });

  it("--json オプションで registry 情報が含まれる", async () => {
    setupSnippet("test-snippet");

    await listSnippets({ registry: "default", json: true, yaml: false, quiet: false });

    const callArg = vi.mocked(logger.infoForOutput).mock.calls[0]?.[0];
    const data = callArg as any;

    expect(data.registries[0].name).toBe("default");
    expect(data.registries[0].type).toBe("local");
    expect(data.registries[0].path).toBe(registryDir);
  });

  it("--yaml オプションで YAML 形式で出力される", async () => {
    setupSnippet("hello-world");

    await listSnippets({ registry: "default", json: false, yaml: true, quiet: false });

    // logger.infoForOutput が呼ばれること
    expect(vi.mocked(logger.infoForOutput)).toHaveBeenCalled();

    const callArg = vi.mocked(logger.infoForOutput).mock.calls[0]?.[0];
    const data = callArg as any;
    expect(Array.isArray(data.registries)).toBe(true);
  });

  it("--quiet オプションで人間向けログが抑制される", async () => {
    setupSnippet("hello-world");

    await listSnippets({ registry: "default", json: false, yaml: false, quiet: true });

    // logger.info や logger.step は呼ばれない
    expect(vi.mocked(logger.info)).not.toHaveBeenCalled();
    expect(vi.mocked(logger.step)).not.toHaveBeenCalled();
    expect(vi.mocked(logger.fileItem)).not.toHaveBeenCalled();
  });

  it("複数 registry がある場合、全て表示される", async () => {
    // 追加の registry を作成
    const registry2Dir = path.join(tmpDir, "registry2");
    fs.mkdirSync(registry2Dir, { recursive: true });
    setupSnippet("snippet1");

    // registry2 に snippet を作成
    const snippet2Name = "snippet2";
    const snippetDefPath = path.join(registry2Dir, `${snippet2Name}.yaml`);
    fs.writeFileSync(snippetDefPath, yaml.dump({ name: snippet2Name }), "utf-8");
    const snippetDir = path.join(registry2Dir, snippet2Name);
    fs.mkdirSync(snippetDir, { recursive: true });

    // testConfig に 2 つの registry を設定
    testConfig = {
      registries: [
        { name: "registry1", path: registryDir },
        { name: "registry2", path: registry2Dir },
      ],
    };

    await listSnippets({ json: true, yaml: false, quiet: false });

    const callArg = vi.mocked(logger.infoForOutput).mock.calls[0]?.[0];
    const data = callArg as any;
    expect(data.registries.length).toBe(2);
  });
});
