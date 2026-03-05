/**
 * official-registry: トップページの VRT (Visual Regression Test)
 * @vrt タグで識別
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("トップページ VRT @vrt", () => {
  test("デスクトップ表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page).toHaveScreenshot("top-page-desktop.png");
  });

  test("タブレット表示", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page).toHaveScreenshot("top-page-tablet.png");
  });

  test("モバイル表示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page).toHaveScreenshot("top-page-mobile.png");
  });
});
