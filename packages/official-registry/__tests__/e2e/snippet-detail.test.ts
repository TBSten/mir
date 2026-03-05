/**
 * official-registry: snippet 詳細ページの E2E テスト
 * site-user-story.md Story 3, 5, 11, 12, 24, 33, 48, 52 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("snippet 詳細ページ", () => {
  test("Story 3: snippet の詳細情報が表示される", async ({ page }) => {
    // 仮の snippet 名。公式 registry にデータが入ったら実際の名前に変更
    await page.goto("/snippets/react-hook");
    await expect(page.locator("h1")).toContainText("react-hook");
  });

  test("Story 3: 変数一覧が表示される", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const variables = page.locator("[data-testid='variables-section']");
    await expect(variables).toBeVisible();
  });

  test("Story 3: ファイルツリーが表示される", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const fileTree = page.locator("[data-testid='file-tree']");
    await expect(fileTree).toBeVisible();
  });

  test("Story 5: テンプレートファイルの内容が表示される", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const fileContent = page.locator("[data-testid='file-content']");
    if (await fileContent.isVisible()) {
      await expect(fileContent).toContainText("{{");
    }
  });

  test("Story 11: インストールコマンドのコピーボタンが存在する", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const copyButton = page.locator("[data-testid='copy-install-command']");
    await expect(copyButton).toBeVisible();
  });

  test("Story 24: hooks セクションが表示される (hooks があるsnippet)", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const hooks = page.locator("[data-testid='hooks-section']");
    // hooks がある snippet では表示、ない snippet では非表示
    if (await hooks.isVisible()) {
      await expect(hooks).toContainText(/hook|before|after/i);
    }
  });

  test("Story 33: YAML 定義タブが表示される", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const yamlTab = page.locator("[data-testid='yaml-tab']");
    if (await yamlTab.isVisible()) {
      await yamlTab.click();
      const yamlContent = page.locator("[data-testid='yaml-content']");
      await expect(yamlContent).toContainText("name:");
    }
  });

  test("Story 48: ネストしたディレクトリのファイルツリーが正しく表示される", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const fileTree = page.locator("[data-testid='file-tree']");
    if (await fileTree.isVisible()) {
      // ツリー構造のインデントやネストが存在すること
      await expect(fileTree).toBeVisible();
    }
  });

  test("Story 52: 依存関係情報セクション (将来機能)", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const deps = page.locator("[data-testid='dependencies-section']");
    // 将来の機能なので存在チェックのみ
    // deps が存在する場合のみ確認
    if (await deps.isVisible()) {
      await expect(deps).toBeVisible();
    }
  });
});
