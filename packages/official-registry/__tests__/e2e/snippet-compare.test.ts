/**
 * official-registry: snippet 比較ページの E2E テスト
 * site-user-story.md Story 055 に対応
 */
import { test, expect } from "@playwright/test";

test.describe("snippet 比較ページ", () => {
  test("複数 snippet を並べて表示できる", async ({ page }) => {
    await page.goto("/snippets?compare=react-hook,react-component");

    // 比較テーブルが表示される
    const table = page.locator("[data-testid='comparison-table']");
    await expect(table).toBeVisible();
  });

  test("比較 URL で正しく snippet が読み込まれる", async ({ page }) => {
    await page.goto("/snippets?compare=react-hook,react-component");

    // 両方の snippet 名が表示される
    await expect(page.locator("body")).toContainText("react-hook");
    await expect(page.locator("body")).toContainText("react-component");
  });

  test("3 個以上の snippet を比較できる", async ({ page }) => {
    await page.goto("/snippets?compare=react-hook,react-component,express-router");

    // 3 つの snippet 名が表示される
    await expect(page.locator("body")).toContainText("react-hook");
    await expect(page.locator("body")).toContainText("react-component");
    await expect(page.locator("body")).toContainText("express-router");
  });

  test("compare パラメータなしでは通常の一覧ページを表示", async ({ page }) => {
    await page.goto("/snippets");

    // 比較テーブルは表示されず、通常の snippet カードが表示される
    const comparisonTable = page.locator("[data-testid='comparison-table']");
    await expect(comparisonTable).not.toBeVisible();
  });

  test("存在しない snippet 名の場合も表示される（データなし状態）", async ({ page }) => {
    await page.goto("/snippets?compare=nonexistent,react-hook");

    // ページは表示され、少なくとも存在する snippet は表示される
    await expect(page.locator("body")).toContainText("react-hook");
  });

  test("比較テーブルで各 snippet の属性（Description, Tags, Variables, Files）が表示される", async ({ page }) => {
    await page.goto("/snippets?compare=react-hook,react-component");

    const table = page.locator("[data-testid='comparison-table']");

    // 各行が表示される
    await expect(table).toContainText("Description");
    await expect(table).toContainText("Tags");
    await expect(table).toContainText("Variables");
    await expect(table).toContainText("Files");
  });

  test("JSON エクスポートボタンが表示される", async ({ page }) => {
    await page.goto("/snippets?compare=react-hook,react-component");

    const exportButton = page.locator("[data-testid='export-json-button']");
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toContainText("export json");
  });

  test("スニペット一覧ページに比較機能へのリンクがある", async ({ page }) => {
    await page.goto("/snippets");

    // 比較機能へのヒントが表示される
    const hint = page.locator("text=compare snippets");
    await expect(hint).toBeVisible();

    // 比較ページへのリンクがある
    const link = page.locator("a:has-text('example')");
    await expect(link).toHaveAttribute("href", /compare=/);
  });
});
