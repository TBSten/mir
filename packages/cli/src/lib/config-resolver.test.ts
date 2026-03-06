import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  resolveConfig,
  clearConfigCache,
  type ResolvedConfig,
} from "./config-resolver.js";
import type { MirConfig } from "./mirconfig.js";

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.MIR_REGISTRY;
  delete process.env.MIR_LOCALE;
  delete process.env.MIR_CONFIG;
  delete process.env.MIR_OUT_DIR;
  delete process.env.MIR_NO_INTERACTIVE;
  clearConfigCache();
});

afterEach(() => {
  process.env = originalEnv;
  clearConfigCache();
});

describe("config-resolver.ts", () => {
  describe("resolveConfig", () => {
    it("優先順位 CLI > ENV > config > default", () => {
      const cliOptions = { registry: "cli-registry" };
      const envVars = { MIR_REGISTRY: "env-registry" };
      const config: Partial<MirConfig> = {
        registries: [{ name: "config-registry", path: "/config" }],
      };

      const resolved = resolveConfig(cliOptions, envVars, config);
      expect(resolved.registry).toBe("cli-registry");
    });

    it("ENV が config より優先", () => {
      const cliOptions = {};
      const envVars = { MIR_REGISTRY: "env-registry" };
      const config: Partial<MirConfig> = {
        registries: [{ name: "config-registry", path: "/config" }],
      };

      const resolved = resolveConfig(cliOptions, envVars, config);
      expect(resolved.registry).toBe("env-registry");
    });

    it("config が default より優先", () => {
      const cliOptions = {};
      const envVars = {};
      const config: Partial<MirConfig> = {
        registries: [{ name: "config-registry", path: "/config" }],
      };

      const resolved = resolveConfig(cliOptions, envVars, config);
      expect(resolved.registry).toBe("config-registry");
    });

    it("すべてが未設定時はデフォルト値を使用", () => {
      const resolved = resolveConfig({}, {}, {});
      expect(resolved.locale).toBe("en");
      expect(resolved.interactive).toBe(true);
    });

    it("locale の優先順位を確認 (CLI > ENV > config > default)", () => {
      const resolved = resolveConfig(
        { locale: "ja" },
        { MIR_LOCALE: "en" },
        { locale: "ja" } as Partial<MirConfig>,
      );
      expect(resolved.locale).toBe("ja");
    });

    it("locale ENV が config より優先", () => {
      const resolved = resolveConfig({}, { MIR_LOCALE: "en" }, { locale: "ja" } as Partial<MirConfig>);
      expect(resolved.locale).toBe("en");
    });

    it("locale デフォルト値は en", () => {
      const resolved = resolveConfig({}, {}, {});
      expect(resolved.locale).toBe("en");
    });

    it("outDir の優先順位を確認", () => {
      const resolved = resolveConfig(
        { outDir: "cli-dir" },
        { MIR_OUT_DIR: "env-dir" },
      );
      expect(resolved.outDir).toBe("cli-dir");
    });

    it("outDir ENV が使われる場合", () => {
      const resolved = resolveConfig({}, { MIR_OUT_DIR: "env-dir" });
      expect(resolved.outDir).toBe("env-dir");
    });

    it("interactive フラグの優先順位", () => {
      const resolved = resolveConfig({
        interactive: false,
      });
      expect(resolved.interactive).toBe(false);
    });

    it("MIR_NO_INTERACTIVE='true' で interactive=false", () => {
      const resolved = resolveConfig({}, { MIR_NO_INTERACTIVE: "true" });
      expect(resolved.interactive).toBe(false);
    });

    it("defaults をマージ", () => {
      const config: Partial<MirConfig> = {
        registries: [],
        defaults: { author: "config-author", version: "1.0" },
      };

      const resolved = resolveConfig({}, {}, config);
      expect(resolved.defaults).toEqual({
        author: "config-author",
        version: "1.0",
      });
    });

    it("defaults が存在しない場合は undefined", () => {
      const config: Partial<MirConfig> = {
        registries: [],
      };

      const resolved = resolveConfig({}, {}, config);
      expect(resolved.defaults).toBeUndefined();
    });

    it("configPath が CLI option で指定された場合", () => {
      const resolved = resolveConfig({ config: "/custom/config.yaml" });
      expect(resolved.configPath).toBe("/custom/config.yaml");
    });

    it("configPath が ENV で指定された場合", () => {
      const resolved = resolveConfig({}, { MIR_CONFIG: "/env/config.yaml" });
      expect(resolved.configPath).toBe("/env/config.yaml");
    });

    it("キャッシュ機能: 同一オブジェクト参照を返す", () => {
      const resolved1 = resolveConfig({}, {});
      const resolved2 = resolveConfig({}, {});
      expect(resolved1).toBe(resolved2);
    });

    it("キャッシュは clearConfigCache で無効化", () => {
      const resolved1 = resolveConfig({});
      clearConfigCache();
      const resolved2 = resolveConfig({ locale: "ja" });
      expect(resolved1).not.toBe(resolved2);
      expect(resolved2.locale).toBe("ja");
    });
  });
});
