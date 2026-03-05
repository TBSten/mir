/**
 * official-registry: ドキュメントページの E2E テスト
 * site-user-story.md Story 32, 43, 50, 57 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("ドキュメントページ", () => {
  test("Story 32: ドキュメントページが表示される", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Story 32: ドキュメントのナビゲーションが存在する", async ({ page }) => {
    await page.goto("/docs");
    const nav = page.locator("[data-testid='docs-nav']");
    await expect(nav).toBeVisible();
  });

  test("Story 43: テンプレート構文のドキュメントページ", async ({ page }) => {
    await page.goto("/docs/template-syntax");
    await expect(page.locator("body")).toContainText("Handlebars");
  });

  test("Story 50: builtin 変数のドキュメント", async ({ page }) => {
    await page.goto("/docs/variables");
    await expect(page.locator("body")).toContainText("project-name");
  });

  test("Story 57: チュートリアルページ", async ({ page }) => {
    await page.goto("/docs/tutorial");
    await expect(page.locator("body")).toContainText(/create|install/i);
  });
});
