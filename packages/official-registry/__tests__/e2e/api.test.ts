/**
 * official-registry: API エンドポイントの E2E テスト
 * site-user-story.md Story 17, 18, 19, 36, 47 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("API エンドポイント", () => {
  test("Story 17: GET /api/snippets が JSON 配列を返す", async ({ request }) => {
    const res = await request.get("/api/snippets");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Story 17: snippet 一覧の各要素に name が含まれる", async ({ request }) => {
    const res = await request.get("/api/snippets");
    const data = await res.json();
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("name");
    }
  });

  test("Story 18: GET /api/snippets/:name が詳細を返す", async ({ request }) => {
    const listRes = await request.get("/api/snippets");
    const list = await listRes.json();
    if (list.length > 0) {
      const name = list[0].name;
      const res = await request.get(`/api/snippets/${name}`);
      expect(res.status()).toBe(200);
      const detail = await res.json();
      expect(detail).toHaveProperty("definition");
      expect(detail).toHaveProperty("files");
    }
  });

  test("Story 18: 存在しない snippet は 404", async ({ request }) => {
    const res = await request.get("/api/snippets/xxxxxxxxnonexistent");
    expect(res.status()).toBe(404);
  });

  test("Story 19: テンプレートファイルの取得", async ({ request }) => {
    const listRes = await request.get("/api/snippets");
    const list = await listRes.json();
    if (list.length > 0) {
      const name = list[0].name;
      const detailRes = await request.get(`/api/snippets/${name}`);
      const detail = await detailRes.json();
      const files = Object.keys(detail.files);
      if (files.length > 0) {
        const filePath = encodeURIComponent(files[0]);
        const res = await request.get(
          `/api/snippets/${name}/files/${filePath}`,
        );
        expect(res.status()).toBe(200);
      }
    }
  });

  test("Story 36: GET /api/search?q= で検索", async ({ request }) => {
    const res = await request.get("/api/search?q=react");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Story 47: ヘルスチェック (snippet一覧で代用)", async ({ request }) => {
    const res = await request.get("/api/snippets");
    expect(res.status()).toBe(200);
  });
});
