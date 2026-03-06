import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getRegistryFromEnv,
  getLocaleFromEnv,
  getConfigPathFromEnv,
  getOutDirFromEnv,
  getNoInteractiveFromEnv,
} from "./env.js";

const originalEnv = process.env;

beforeEach(() => {
  // 各テスト前に MIR_* 環境変数をクリア
  process.env = { ...originalEnv };
  delete process.env.MIR_REGISTRY;
  delete process.env.MIR_LOCALE;
  delete process.env.MIR_CONFIG;
  delete process.env.MIR_OUT_DIR;
  delete process.env.MIR_NO_INTERACTIVE;
});

afterEach(() => {
  process.env = originalEnv;
});

describe("env.ts", () => {
  describe("getRegistryFromEnv", () => {
    it("MIR_REGISTRY 環境変数を取得", () => {
      process.env.MIR_REGISTRY = "my-registry";
      expect(getRegistryFromEnv()).toBe("my-registry");
    });

    it("環境変数未設定時は undefined を返す", () => {
      expect(getRegistryFromEnv()).toBeUndefined();
    });
  });

  describe("getLocaleFromEnv", () => {
    it("有効な MIR_LOCALE (ja) を取得", () => {
      process.env.MIR_LOCALE = "ja";
      expect(getLocaleFromEnv()).toBe("ja");
    });

    it("有効な MIR_LOCALE (en) を取得", () => {
      process.env.MIR_LOCALE = "en";
      expect(getLocaleFromEnv()).toBe("en");
    });

    it("無効な MIR_LOCALE は undefined を返す", () => {
      process.env.MIR_LOCALE = "invalid";
      expect(getLocaleFromEnv()).toBeUndefined();
    });

    it("環境変数未設定時は undefined を返す", () => {
      expect(getLocaleFromEnv()).toBeUndefined();
    });
  });

  describe("getConfigPathFromEnv", () => {
    it("MIR_CONFIG 設定ファイルパスを取得", () => {
      process.env.MIR_CONFIG = "/custom/config.yaml";
      expect(getConfigPathFromEnv()).toBe("/custom/config.yaml");
    });

    it("環境変数未設定時は undefined を返す", () => {
      expect(getConfigPathFromEnv()).toBeUndefined();
    });
  });

  describe("getOutDirFromEnv", () => {
    it("MIR_OUT_DIR 出力ディレクトリを取得", () => {
      process.env.MIR_OUT_DIR = "./dist";
      expect(getOutDirFromEnv()).toBe("./dist");
    });

    it("環境変数未設定時は undefined を返す", () => {
      expect(getOutDirFromEnv()).toBeUndefined();
    });
  });

  describe("getNoInteractiveFromEnv", () => {
    it("MIR_NO_INTERACTIVE='true' で true を返す", () => {
      process.env.MIR_NO_INTERACTIVE = "true";
      expect(getNoInteractiveFromEnv()).toBe(true);
    });

    it("MIR_NO_INTERACTIVE='false' で false を返す", () => {
      process.env.MIR_NO_INTERACTIVE = "false";
      expect(getNoInteractiveFromEnv()).toBe(false);
    });

    it("MIR_NO_INTERACTIVE='1' で true を返す", () => {
      process.env.MIR_NO_INTERACTIVE = "1";
      expect(getNoInteractiveFromEnv()).toBe(true);
    });

    it("MIR_NO_INTERACTIVE='0' で false を返す", () => {
      process.env.MIR_NO_INTERACTIVE = "0";
      expect(getNoInteractiveFromEnv()).toBe(false);
    });

    it("環境変数未設定時は false を返す", () => {
      expect(getNoInteractiveFromEnv()).toBe(false);
    });

    it("無効な値の場合は false を返す", () => {
      process.env.MIR_NO_INTERACTIVE = "invalid";
      expect(getNoInteractiveFromEnv()).toBe(false);
    });
  });
});
