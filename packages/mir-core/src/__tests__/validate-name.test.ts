/**
 * mir-core: validateSnippetName の unit テスト
 */
import { describe, it, expect } from "vitest";
import { validateSnippetName, ValidationError } from "../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe.skip("validateSnippetName", () => {
  describe("正常系", () => {
    it("英小文字のみ", () => {
      expect(() => validateSnippetName("react")).not.toThrow();
    });

    it("英数字 + ハイフン", () => {
      expect(() => validateSnippetName("react-hook")).not.toThrow();
    });

    it("数字始まり", () => {
      expect(() => validateSnippetName("1component")).not.toThrow();
    });

    it("大文字含む", () => {
      expect(() => validateSnippetName("MyComponent")).not.toThrow();
    });

    it("1文字", () => {
      expect(() => validateSnippetName("a")).not.toThrow();
    });
  });

  describe("異常系", () => {
    it("空文字でエラー", () => {
      expect(() => validateSnippetName("")).toThrow(ValidationError);
    });

    it("アンダースコアでエラー", () => {
      expect(() => validateSnippetName("my_comp")).toThrow(ValidationError);
    });

    it("先頭ハイフンでエラー", () => {
      expect(() => validateSnippetName("-invalid")).toThrow(ValidationError);
    });

    it("スペース含むとエラー", () => {
      expect(() => validateSnippetName("my comp")).toThrow(ValidationError);
    });

    it("日本語でエラー", () => {
      expect(() => validateSnippetName("テスト")).toThrow(ValidationError);
    });

    it("特殊文字でエラー", () => {
      expect(() => validateSnippetName("react@hook")).toThrow(ValidationError);
    });

    it("ドット含むとエラー", () => {
      expect(() => validateSnippetName("my.comp")).toThrow(ValidationError);
    });
  });
});
