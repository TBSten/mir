/**
 * mir-core: i18n の unit テスト
 */
import { describe, it, expect, beforeEach } from "vitest";
import { setLocale, getLocale, t } from "../index.js";
import type { Locale } from "../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe("i18n", () => {
  beforeEach(() => {
    setLocale("ja");
  });

  describe("setLocale / getLocale", () => {
    it("デフォルトは ja", () => {
      expect(getLocale()).toBe("ja");
    });

    it("en に切り替え可能", () => {
      setLocale("en");
      expect(getLocale()).toBe("en");
    });

    it("ja に戻せる", () => {
      setLocale("en");
      setLocale("ja");
      expect(getLocale()).toBe("ja");
    });
  });

  describe("t (メッセージ取得)", () => {
    it("日本語メッセージを取得する", () => {
      setLocale("ja");
      const msg = t("error.snippet-not-found", { name: "test" });
      expect(msg).toContain("test");
      expect(msg).not.toBe("");
    });

    it("英語メッセージを取得する", () => {
      setLocale("en");
      const msg = t("error.snippet-not-found", { name: "test" });
      expect(msg).toContain("test");
      expect(msg).not.toBe("");
    });

    it("日英でメッセージが異なる", () => {
      setLocale("ja");
      const ja = t("error.snippet-not-found", { name: "x" });
      setLocale("en");
      const en = t("error.snippet-not-found", { name: "x" });
      expect(ja).not.toBe(en);
    });

    it("パラメータが展開される", () => {
      const msg = t("error.invalid-snippet-name", { name: "bad_name" });
      expect(msg).toContain("bad_name");
    });
  });
});
