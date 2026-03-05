/**
 * official-registry: トップページの E2E テスト
 * site-user-story.md Story 1, 26, 51 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("トップページ", () => {
  test("Story 1: トップページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("mir");
    await expect(page).toHaveTitle(/mir/);
  });

  test("Story 1: サイトの説明テキストが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/snippet|registry/i);
  });

  test("Story 26: モバイル表示でもレイアウトが崩れない", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });
});
