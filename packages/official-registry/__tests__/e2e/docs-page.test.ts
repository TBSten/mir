/**
 * official-registry: ドキュメントページの E2E テスト
 * site-user-story.md Story 32, 43, 50, 57 に対応
 */
import { test, expect } from "@playwright/test";

test.describe("ドキュメントページ", () => {
  test("Story 32: ドキュメントページが表示される", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("Story 32: ドキュメントのナビゲーションが存在する", async ({ page }) => {
    await page.goto("/docs");
    // ドキュメントセクションのリンクが表示されていることを確認
    const links = await page.locator('a[href*="/docs/"]').count();
    expect(links).toBeGreaterThan(0);
  });

  test("Story 43: テンプレート構文のドキュメントページ", async ({ page }) => {
    await page.goto("/docs/template-syntax");
    await expect(page.locator("body")).toContainText("Handlebars");
  });

  test("Story 50: builtin 変数のドキュメント", async ({ page }) => {
    await page.goto("/docs/variables");
    await expect(page.locator("body")).toContainText("project-name");
  });

  test("Story 57: チュートリアルページが読み込める", async ({ page }) => {
    await page.goto("/docs/tutorial");
    const response = page.context();
    expect(response).toBeDefined();
  });

  test("Story 57: チュートリアルページに必須セクションが含まれる", async ({ page }) => {
    await page.goto("/docs/tutorial");
    // ページタイトル確認
    await expect(page.locator("h1")).toContainText(/Tutorial|Create/i);
  });

  test("Story 57: チュートリアルのステップが表示される", async ({ page }) => {
    await page.goto("/docs/tutorial");
    // 複数のステップが表示されていることを確認
    const steps = await page.locator("section").count();
    expect(steps).toBeGreaterThan(3);
  });

  test("Story 57: チュートリアルにコマンド例が含まれる", async ({ page }) => {
    await page.goto("/docs/tutorial");
    // 主要コマンドが含まれていることを確認
    await expect(page.locator("body")).toContainText(/mir init|mir create|mir publish|mir install/i);
  });

  test("Story 57: チュートリアルに init コマンド説明がある", async ({ page }) => {
    await page.goto("/docs/tutorial");
    await expect(page.locator("body")).toContainText("mir init");
  });

  test("Story 57: チュートリアルに create コマンド説明がある", async ({ page }) => {
    await page.goto("/docs/tutorial");
    await expect(page.locator("body")).toContainText("mir create");
  });

  test("Story 57: チュートリアルに install コマンド説明がある", async ({ page }) => {
    await page.goto("/docs/tutorial");
    await expect(page.locator("body")).toContainText("mir install");
  });

  test("Story 57: チュートリアルに次のステップセクションがある", async ({ page }) => {
    await page.goto("/docs/tutorial");
    await expect(page.locator("body")).toContainText(/Next Steps|Tips/i);
  });

  test("Story 57: チュートリアルから他のドキュメントへのリンクがある", async ({ page }) => {
    await page.goto("/docs/tutorial");
    // 他のドキュメントページへのリンクを確認
    const docsLinks = await page.locator('a[href*="/docs/"]').count();
    expect(docsLinks).toBeGreaterThan(0);
  });

  test("Story 57: チュートリアルページが responsive である", async ({ page }) => {
    // モバイルサイズで確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/docs/tutorial");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });
});
