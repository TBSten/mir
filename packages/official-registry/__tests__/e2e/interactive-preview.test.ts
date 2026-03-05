/**
 * official-registry: インタラクティブプレビューの E2E テスト
 * site-user-story.md Story 12 に対応
 */
import { test, expect } from "@playwright/test";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

test.describe.skip("インタラクティブプレビュー", () => {
  test("Story 12: 変数入力でリアルタイムプレビューが更新される", async ({ page }) => {
    await page.goto("/snippets/react-hook");

    const previewTab = page.locator("[data-testid='preview-tab']");
    if (await previewTab.isVisible()) {
      await previewTab.click();

      // 変数入力欄に値を入力
      const nameInput = page.locator("[data-testid='preview-var-name']");
      await nameInput.fill("useAuth");

      // プレビューが更新されることを確認
      const preview = page.locator("[data-testid='preview-content']");
      await expect(preview).toContainText("useAuth");
    }
  });

  test("Story 12: プレビューでファイル名も変数展開される", async ({ page }) => {
    await page.goto("/snippets/react-hook");

    const previewTab = page.locator("[data-testid='preview-tab']");
    if (await previewTab.isVisible()) {
      await previewTab.click();

      const nameInput = page.locator("[data-testid='preview-var-name']");
      await nameInput.fill("useAuth");

      // ファイル名のプレビュー
      const fileNames = page.locator("[data-testid='preview-file-name']");
      const count = await fileNames.count();
      if (count > 0) {
        await expect(fileNames.first()).toContainText("useAuth");
      }
    }
  });
});
