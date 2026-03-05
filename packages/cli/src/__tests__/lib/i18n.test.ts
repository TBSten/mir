import { describe, it, expect, afterEach } from "vitest";
import { t, setLocale, getLocale } from "../../lib/i18n/index.js";

afterEach(() => {
  setLocale("ja");
});

describe("i18n", () => {
  it("デフォルトは日本語", () => {
    expect(getLocale()).toBe("ja");
  });

  it("日本語メッセージを返す", () => {
    setLocale("ja");
    expect(t("error.snippet-not-found", { name: "test" })).toBe(
      'Snippet "test" が見つかりません',
    );
  });

  it("英語に切り替えできる", () => {
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("error.snippet-not-found", { name: "test" })).toBe(
      'Snippet "test" not found',
    );
  });

  it("パラメータを展開する", () => {
    expect(t("sync.success", { count: 3 })).toBe("3 件の変数を追加しました");
  });

  it("英語でもパラメータを展開する", () => {
    setLocale("en");
    expect(t("sync.success", { count: 3 })).toBe("Added 3 variable(s)");
  });

  it("パラメータなしのメッセージ", () => {
    expect(t("sync.no-new-vars")).toBe("追加する変数はありません");
  });
});
