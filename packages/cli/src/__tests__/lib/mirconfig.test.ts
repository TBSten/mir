import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import {
  loadMirConfig,
  loadSingleConfig,
  mergeConfigs,
  resolvePublishRegistry,
  resolveInstallRegistries,
} from "../../lib/mirconfig.js";
import {
  RegistryNotFoundError,
  RegistryRemoteError,
} from "@mir/core";
import type { MirConfig } from "../../lib/mirconfig.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-mirconfig-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("loadSingleConfig", () => {
  it("ファイルが存在しない場合はデフォルト設定を返す", () => {
    const config = loadSingleConfig(path.join(tmpDir, "nonexistent.yaml"));
    expect(config.registries).toEqual([{ path: "~/.mir/registry" }]);
  });

  it("設定ファイルを読み込む", () => {
    const configPath = path.join(tmpDir, "config.yaml");
    const configData = {
      registries: [
        { name: "default", path: "~/.mir/registry" },
        { name: "team", path: "~/team-snippets" },
      ],
    };
    fs.writeFileSync(configPath, yaml.dump(configData), "utf-8");

    const config = loadSingleConfig(configPath);
    expect(config.registries).toHaveLength(2);
    expect(config.registries[0].name).toBe("default");
    expect(config.registries[1].name).toBe("team");
  });

  it("空のファイルの場合はデフォルト設定を返す", () => {
    const configPath = path.join(tmpDir, "config.yaml");
    fs.writeFileSync(configPath, "", "utf-8");

    const config = loadSingleConfig(configPath);
    expect(config.registries).toEqual([{ path: "~/.mir/registry" }]);
  });
});

describe("loadMirConfig", () => {
  it("configPath を指定した場合はそのファイルのみ読む", () => {
    const configPath = path.join(tmpDir, "config.yaml");
    const configData = {
      registries: [{ name: "custom", path: "/custom" }],
    };
    fs.writeFileSync(configPath, yaml.dump(configData), "utf-8");

    const config = loadMirConfig({ configPath });
    expect(config.registries).toHaveLength(1);
    expect(config.registries[0].name).toBe("custom");
  });
});

describe("mergeConfigs", () => {
  it("ローカルの registries が先頭に来る", () => {
    const local: MirConfig = {
      registries: [{ name: "local", path: "/local" }],
    };
    const global: MirConfig = {
      registries: [{ name: "global", path: "/global" }],
    };
    const merged = mergeConfigs(local, global);
    expect(merged.registries).toHaveLength(2);
    expect(merged.registries[0].name).toBe("local");
    expect(merged.registries[1].name).toBe("global");
  });

  it("同名の registry はローカルが優先される", () => {
    const local: MirConfig = {
      registries: [{ name: "default", path: "/local-path" }],
    };
    const global: MirConfig = {
      registries: [{ name: "default", path: "/global-path" }],
    };
    const merged = mergeConfigs(local, global);
    expect(merged.registries).toHaveLength(1);
    expect(merged.registries[0].path).toBe("/local-path");
  });

  it("defaults はローカルで上書きされる", () => {
    const local: MirConfig = {
      registries: [],
      defaults: { author: "local-author" },
    };
    const global: MirConfig = {
      registries: [],
      defaults: { author: "global-author" },
    };
    const merged = mergeConfigs(local, global);
    expect(merged.defaults?.author).toBe("local-author");
  });

  it("名前のない global registry は常に含まれる", () => {
    const local: MirConfig = {
      registries: [{ name: "local", path: "/local" }],
    };
    const global: MirConfig = {
      registries: [{ path: "~/.mir/registry" }],
    };
    const merged = mergeConfigs(local, global);
    expect(merged.registries).toHaveLength(2);
    expect(merged.registries[1].path).toBe("~/.mir/registry");
  });
});

describe("resolvePublishRegistry", () => {
  it("名前指定でローカル registry を返す", () => {
    const config = {
      registries: [
        { name: "default", path: "~/.mir/registry" },
        { name: "team", path: "~/team" },
      ],
    };
    const result = resolvePublishRegistry(config, "team");
    expect(result.name).toBe("team");
    expect(result.path).toBe("~/team");
  });

  it("名前未指定で先頭のローカル registry を返す", () => {
    const config = {
      registries: [
        { name: "remote", url: "https://example.com" },
        { name: "local", path: "~/.mir/registry" },
      ],
    };
    const result = resolvePublishRegistry(config);
    expect(result.name).toBe("local");
  });

  it("存在しない registry 名でエラー", () => {
    const config = { registries: [{ name: "a", path: "/a" }] };
    expect(() => resolvePublishRegistry(config, "nonexistent")).toThrow(
      RegistryNotFoundError,
    );
  });

  it("リモート registry を指定するとエラー", () => {
    const config = {
      registries: [{ name: "remote", url: "https://example.com" }],
    };
    expect(() => resolvePublishRegistry(config, "remote")).toThrow(
      RegistryRemoteError,
    );
  });
});

describe("resolveInstallRegistries", () => {
  it("名前未指定で全 registry を返す", () => {
    const config = {
      registries: [
        { name: "a", path: "/a" },
        { name: "b", url: "https://example.com" },
      ],
    };
    const result = resolveInstallRegistries(config);
    expect(result).toHaveLength(2);
  });

  it("名前指定で1件のみ返す", () => {
    const config = {
      registries: [
        { name: "a", path: "/a" },
        { name: "b", path: "/b" },
      ],
    };
    const result = resolveInstallRegistries(config, "b");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("b");
  });

  it("存在しない名前でエラー", () => {
    const config = { registries: [{ name: "a", path: "/a" }] };
    expect(() => resolveInstallRegistries(config, "nonexistent")).toThrow(
      RegistryNotFoundError,
    );
  });
});
