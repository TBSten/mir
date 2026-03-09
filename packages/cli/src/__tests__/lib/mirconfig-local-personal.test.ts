import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import {
  loadSingleConfig,
  mergeConfigs,
  saveRegistryToken,
  removeRegistryToken,
} from "../../lib/mirconfig.js";
import type { MirConfig } from "../../lib/mirconfig.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-local-personal-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("3段階マージ", () => {
  const globalConf: MirConfig = {
    registries: [
      { name: "official", url: "https://mir.tbsten.me" },
      { name: "default", path: "~/.mir/registry" },
    ],
    defaults: { author: "global-author" },
    locale: "en",
  };

  const localConf: MirConfig = {
    registries: [{ name: "team", path: "~/team-snippets" }],
    defaults: { author: "local-author" },
    locale: "ja",
  };

  const localPersonalConf: MirConfig = {
    registries: [
      { name: "official", url: "https://mir.tbsten.me", publish_token: "my-token" },
    ],
    defaults: { author: "personal-author" },
    locale: "en",
  };

  it("3ファイル全て存在 → 正しい優先順位でマージされる", () => {
    const merged = mergeConfigs(localPersonalConf, mergeConfigs(localConf, globalConf));
    expect(merged.registries[0].name).toBe("official");
    expect(merged.registries[0].publish_token).toBe("my-token");
    expect(merged.defaults?.author).toBe("personal-author");
    expect(merged.locale).toBe("en");
  });

  it("config.local.yaml が存在しない場合は従来通り 2段階マージ", () => {
    const emptyConf: MirConfig = { registries: [] };
    const merged = mergeConfigs(emptyConf, mergeConfigs(localConf, globalConf));
    expect(merged.registries[0].name).toBe("team");
    expect(merged.defaults?.author).toBe("local-author");
    expect(merged.locale).toBe("ja");
  });

  it("config.local.yaml のみ存在（config.yaml なし）", () => {
    const emptyConf: MirConfig = { registries: [] };
    const merged = mergeConfigs(localPersonalConf, mergeConfigs(emptyConf, globalConf));
    expect(merged.registries[0].name).toBe("official");
    expect(merged.registries[0].publish_token).toBe("my-token");
    expect(merged.defaults?.author).toBe("personal-author");
  });

  it("config.local.yaml の registries が config.yaml の同名 registry を上書き", () => {
    const local: MirConfig = {
      registries: [{ name: "team", path: "/old-path" }],
    };
    const personal: MirConfig = {
      registries: [{ name: "team", path: "/new-path" }],
    };
    const merged = mergeConfigs(personal, mergeConfigs(local, globalConf));
    const teamEntries = merged.registries.filter((r) => r.name === "team");
    expect(teamEntries).toHaveLength(1);
    expect(teamEntries[0].path).toBe("/new-path");
  });

  it("config.local.yaml の defaults が config.yaml の defaults を上書き", () => {
    const local: MirConfig = {
      registries: [],
      defaults: { author: "from-local" },
    };
    const personal: MirConfig = {
      registries: [],
      defaults: { author: "from-personal" },
    };
    const merged = mergeConfigs(personal, mergeConfigs(local, globalConf));
    expect(merged.defaults?.author).toBe("from-personal");
  });

  it("config.local.yaml の locale が config.yaml の locale を上書き", () => {
    const local: MirConfig = { registries: [], locale: "ja" };
    const personal: MirConfig = { registries: [], locale: "en" };
    const merged = mergeConfigs(personal, mergeConfigs(local, globalConf));
    expect(merged.locale).toBe("en");
  });

  it("config.local.yaml に locale のみ設定 → registries は下位レイヤーから継承", () => {
    const personal: MirConfig = { registries: [], locale: "en" };
    const merged = mergeConfigs(personal, mergeConfigs(localConf, globalConf));
    expect(merged.registries.length).toBeGreaterThan(0);
    expect(merged.registries[0].name).toBe("team");
    expect(merged.locale).toBe("en");
  });
});

describe("loadSingleConfig で config.local.yaml を読み込み", () => {
  it("config.local.yaml を直接読み込める", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    const data = {
      registries: [{ name: "personal", path: "/personal" }],
      locale: "en",
    };
    fs.writeFileSync(configPath, yaml.dump(data), "utf-8");

    const config = loadSingleConfig(configPath);
    expect(config.registries).toHaveLength(1);
    expect(config.registries[0].name).toBe("personal");
    expect(config.locale).toBe("en");
  });

  it("空の config.local.yaml → デフォルト設定にフォールバック", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(configPath, "", "utf-8");

    const config = loadSingleConfig(configPath);
    expect(config.registries).toHaveLength(2);
  });

  it("不正な YAML → 例外", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(configPath, "invalid: [yaml: {broken", "utf-8");

    expect(() => loadSingleConfig(configPath)).toThrow();
  });

  it("registries のみ設定 → defaults, locale は undefined", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(configPath, yaml.dump({ registries: [{ name: "x", path: "/x" }] }), "utf-8");

    const config = loadSingleConfig(configPath);
    expect(config.registries).toHaveLength(1);
    expect(config.defaults).toBeUndefined();
    expect(config.locale).toBeUndefined();
  });
});

describe("resolvePublishRegistry 3段階マージ経由", () => {
  it("config.local.yaml に publish_token 付き registry がある場合、publish に使用される", () => {
    const global: MirConfig = {
      registries: [{ name: "official", url: "https://mir.tbsten.me" }],
    };
    const local: MirConfig = { registries: [] };
    const personal: MirConfig = {
      registries: [{ name: "official", url: "https://mir.tbsten.me", publish_token: "tok" }],
    };
    const merged = mergeConfigs(personal, mergeConfigs(local, global));
    const official = merged.registries.find((r) => r.name === "official");
    expect(official?.publish_token).toBe("tok");
  });
});

describe("saveRegistryToken / removeRegistryToken にパス指定", () => {
  it("パス指定 → 指定パスに書き込む", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(configPath, yaml.dump({ registries: [{ name: "official", url: "https://example.com" }] }), "utf-8");

    saveRegistryToken("official", "test-token", configPath);

    const config = loadSingleConfig(configPath);
    const entry = config.registries.find((r) => r.name === "official");
    expect(entry?.publish_token).toBe("test-token");
  });

  it("パス省略 → 関数は3引数（従来互換）", () => {
    expect(typeof saveRegistryToken).toBe("function");
    expect(saveRegistryToken.length).toBe(3);
  });

  it("config ファイルが存在しない → 新規作成して保存", () => {
    const configPath = path.join(tmpDir, "new-config.yaml");
    saveRegistryToken("my-reg", "tok123", configPath);

    expect(fs.existsSync(configPath)).toBe(true);
    const config = loadSingleConfig(configPath);
    const entry = config.registries.find((r) => r.name === "my-reg");
    expect(entry?.publish_token).toBe("tok123");
  });

  it("既存 registry に token 追加 → 他フィールドは維持", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(
      configPath,
      yaml.dump({ registries: [{ name: "remote", url: "https://example.com" }] }),
      "utf-8",
    );

    saveRegistryToken("remote", "new-token", configPath);

    const config = loadSingleConfig(configPath);
    const entry = config.registries.find((r) => r.name === "remote");
    expect(entry?.url).toBe("https://example.com");
    expect(entry?.publish_token).toBe("new-token");
  });

  it("removeRegistryToken → token のみ削除、他フィールドは維持", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(
      configPath,
      yaml.dump({
        registries: [{ name: "remote", url: "https://example.com", publish_token: "old" }],
        locale: "ja",
      }),
      "utf-8",
    );

    removeRegistryToken("remote", configPath);

    const config = loadSingleConfig(configPath);
    const entry = config.registries.find((r) => r.name === "remote");
    expect(entry?.url).toBe("https://example.com");
    expect(entry?.publish_token).toBeUndefined();
    expect(config.locale).toBe("ja");
  });

  it("removeRegistryToken で token が存在しない registry → no-op", () => {
    const configPath = path.join(tmpDir, "config.local.yaml");
    fs.writeFileSync(
      configPath,
      yaml.dump({ registries: [{ name: "remote", url: "https://example.com" }] }),
      "utf-8",
    );

    expect(() => removeRegistryToken("remote", configPath)).not.toThrow();
    expect(() => removeRegistryToken("nonexistent", configPath)).not.toThrow();
  });
});
