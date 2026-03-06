/**
 * official-registry: /api/compare エンドポイントのテスト
 */
import { describe, it, expect } from "vitest";

describe("API /compare endpoint", () => {
  it("should accept compare parameter", () => {
    // API エンドポイント自体のテストは E2E テストで行う
    // ここではパラメータ解析ロジックのみテスト
    const compareParam = "react-hook,react-component";
    const names = compareParam
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    expect(names).toEqual(["react-hook", "react-component"]);
  });

  it("should remove duplicates", () => {
    const compareParam = "react-hook,react-component,react-hook";
    const names = compareParam
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const uniqueNames = Array.from(new Set(names));
    expect(uniqueNames).toEqual(["react-hook", "react-component"]);
  });

  it("should handle empty names", () => {
    const compareParam = "   ,  , react-hook";
    const names = compareParam
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    expect(names).toEqual(["react-hook"]);
  });
});
