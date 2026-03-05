/**
 * official-registry: snippet 一覧ページの E2E テスト
 * site-user-story.md Story 2, 22, 27, 38 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("snippet 一覧ページ", () => {
  test("Story 2: snippet 一覧が表示される", async ({ page }) => {
    await page.goto("/snippets");
    // snippet 名が表示されること
    await expect(page.locator("[data-testid='snippet-list']")).toBeVisible();
  });

  test("Story 2: 各 snippet に名前と説明が表示される", async ({ page }) => {
    await page.goto("/snippets");
    const firstSnippet = page.locator("[data-testid='snippet-card']").first();
    await expect(firstSnippet.locator("[data-testid='snippet-name']")).toBeVisible();
    await expect(firstSnippet.locator("[data-testid='snippet-description']")).toBeVisible();
  });

  test("Story 22: 検索結果が 0 件のときメッセージが表示される", async ({ page }) => {
    await page.goto("/snippets");
    const searchInput = page.locator("[data-testid='search-input']");
    await searchInput.fill("xxxxxxnonexistent");
    await expect(page.locator("[data-testid='no-results']")).toBeVisible();
  });

  test("Story 27: カテゴリフィルタが機能する", async ({ page }) => {
    await page.goto("/snippets");
    const filter = page.locator("[data-testid='category-filter']");
    if (await filter.isVisible()) {
      await filter.selectOption({ index: 1 });
      // フィルタ後もリストが表示されること
      await expect(page.locator("[data-testid='snippet-list']")).toBeVisible();
    }
  });
});
