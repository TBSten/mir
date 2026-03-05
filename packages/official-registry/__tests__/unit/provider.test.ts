import { describe, it, expect } from "vitest";
import { staticProvider } from "../../app/lib/provider.js";

describe("staticProvider", () => {
  describe("list", () => {
    it("snippet 一覧を返す", async () => {
      const list = await staticProvider.list();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });

    it("各 snippet に name がある", async () => {
      const list = await staticProvider.list();
      for (const s of list) {
        expect(s.name).toBeDefined();
        expect(typeof s.name).toBe("string");
      }
    });
  });

  describe("get", () => {
    it("存在する snippet の詳細を返す", async () => {
      const detail = await staticProvider.get("react-hook");
      expect(detail).not.toBeNull();
      expect(detail!.definition.name).toBe("react-hook");
      expect(detail!.files.size).toBeGreaterThan(0);
    });

    it("存在しない snippet は null を返す", async () => {
      const detail = await staticProvider.get("nonexistent");
      expect(detail).toBeNull();
    });
  });

  describe("search", () => {
    it("名前で検索できる", async () => {
      const results = await staticProvider.search!("react");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain("react");
    });

    it("マッチしない場合は空配列", async () => {
      const results = await staticProvider.search!("zzzznonexistent");
      expect(results).toEqual([]);
    });
  });
});
