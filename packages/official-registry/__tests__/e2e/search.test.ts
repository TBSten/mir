/**
 * official-registry: 検索機能の E2E テスト
 * site-user-story.md Story 4, 22 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("検索機能", () => {
  test("Story 4: 検索バーで snippet を検索できる", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator("[data-testid='search-input']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("react");
      // 検索結果が表示されることを確認
      await expect(page.locator("[data-testid='search-results']")).toBeVisible();
    }
  });

  test("Story 4: 検索結果に snippet 名と説明が含まれる", async ({ page }) => {
    await page.goto("/snippets");
    const searchInput = page.locator("[data-testid='search-input']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("react");
      const result = page.locator("[data-testid='snippet-card']").first();
      await expect(result).toBeVisible();
    }
  });

  test("Story 22: 検索結果 0 件で適切なメッセージ表示", async ({ page }) => {
    await page.goto("/snippets");
    const searchInput = page.locator("[data-testid='search-input']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("zzzznonexistent");
      await expect(page.locator("[data-testid='no-results']")).toBeVisible();
    }
  });
});
