/**
 * official-registry: snippet 詳細ページの VRT
 * @vrt タグで識別
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("snippet 詳細ページ VRT @vrt", () => {
  test("詳細ページ デスクトップ表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets/react-hook");
    await expect(page).toHaveScreenshot("snippet-detail-desktop.png");
  });

  test("詳細ページ モバイル表示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/snippets/react-hook");
    await expect(page).toHaveScreenshot("snippet-detail-mobile.png");
  });

  test("変数セクション表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets/react-hook");
    const variables = page.locator("[data-testid='variables-section']");
    if (await variables.isVisible()) {
      await expect(variables).toHaveScreenshot("snippet-detail-variables.png");
    }
  });

  test("ファイルツリー表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets/react-hook");
    const fileTree = page.locator("[data-testid='file-tree']");
    if (await fileTree.isVisible()) {
      await expect(fileTree).toHaveScreenshot("snippet-detail-file-tree.png");
    }
  });

  test("YAML タブ表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets/react-hook");
    const yamlTab = page.locator("[data-testid='yaml-tab']");
    if (await yamlTab.isVisible()) {
      await yamlTab.click();
      await expect(page).toHaveScreenshot("snippet-detail-yaml-tab.png");
    }
  });

  test("プレビュータブ表示", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/snippets/react-hook");
    const previewTab = page.locator("[data-testid='preview-tab']");
    if (await previewTab.isVisible()) {
      await previewTab.click();
      await expect(page).toHaveScreenshot("snippet-detail-preview-tab.png");
    }
  });
});
