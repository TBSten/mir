/**
 * official-registry: snippet 一覧ページの VRT
 * @vrt タグで識別
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("snippet 一覧ページ VRT @vrt", () => {
  test("一覧ページ デスクトップ表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets");
    await expect(page).toHaveScreenshot("snippet-list-desktop.png");
  });

  test("一覧ページ モバイル表示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/snippets");
    await expect(page).toHaveScreenshot("snippet-list-mobile.png");
  });

  test("検索結果表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets");
    const searchInput = page.locator("[data-testid='search-input']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("react");
      await page.waitForTimeout(500); // debounce 待ち
      await expect(page).toHaveScreenshot("snippet-list-search-result.png");
    }
  });

  test("検索結果 0 件表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets");
    const searchInput = page.locator("[data-testid='search-input']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("zzzznonexistent");
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot("snippet-list-no-results.png");
    }
  });
});
