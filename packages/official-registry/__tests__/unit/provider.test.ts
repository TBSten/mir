import { describe, it, expect } from "vitest";
import { staticProvider } from "../../app/lib/provider.js";

describe("staticProvider", () => {
  describe("list", () => {
    it("snippet 一覧を返す (5 件)", async () => {
      const list = await staticProvider.list();
      expect(Array.isArray(list)).toBe(true);
      expect(list).toHaveLength(5);
    });

    it("各 snippet に name がある", async () => {
      const list = await staticProvider.list();
      for (const s of list) {
        expect(s.name).toBeDefined();
        expect(typeof s.name).toBe("string");
      }
    });

    it("全ての期待する snippet が含まれる", async () => {
      const list = await staticProvider.list();
      const names = list.map((s) => s.name);
      expect(names).toContain("react-hook");
      expect(names).toContain("react-component");
      expect(names).toContain("express-router");
      expect(names).toContain("nextjs-page");
      expect(names).toContain("vitest-setup");
    });
  });

  describe("get", () => {
    it("存在する snippet の詳細を返す", async () => {
      const detail = await staticProvider.get("react-hook");
      expect(detail).not.toBeNull();
      expect(detail!.definition.name).toBe("react-hook");
      expect(detail!.files.size).toBeGreaterThan(0);
    });

    it("テンプレート変数付き snippet を返す", async () => {
      const detail = await staticProvider.get("react-component");
      expect(detail).not.toBeNull();
      expect(detail!.definition.variables).toHaveProperty("name");
      expect(detail!.files.has("{{ name }}.tsx")).toBe(true);
    });

    it("存在しない snippet は null を返す", async () => {
      const detail = await staticProvider.get("nonexistent");
      expect(detail).toBeNull();
    });
  });

  describe("search", () => {
    it("名前で検索できる", async () => {
      const results = await staticProvider.search!("react");
      expect(results).toHaveLength(2);
      const names = results.map((s) => s.name);
      expect(names).toContain("react-hook");
      expect(names).toContain("react-component");
    });

    it("description で検索できる", async () => {
      const results = await staticProvider.search!("boilerplate");
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("react-component");
    });

    it("マッチしない場合は空配列", async () => {
      const results = await staticProvider.search!("zzzznonexistent");
      expect(results).toEqual([]);
    });
  });
});
