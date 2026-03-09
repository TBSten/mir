import type { Command } from "commander";
import { removeRegistryToken } from "../lib/mirconfig.js";
import { localPersonalConfigPath } from "../lib/paths.js";
import * as logger from "../lib/logger.js";

export function registerLogoutCommand(program: Command): void {
  program
    .command("logout")
    .description("registry からログアウト（保存された token を削除）")
    .option("--registry <name>", "対象 registry 名 (デフォルト: official)")
    .option("--local", "プロジェクトローカルの config.local.yaml から token を削除")
    .action(async (opts) => {
      const registryName = opts.registry || "official";

      const targetConfigPath = opts.local
        ? localPersonalConfigPath(process.cwd())
        : undefined;

      try {
        removeRegistryToken(registryName, targetConfigPath);
        const dest = opts.local ? ".mir/config.local.yaml" : "グローバル設定";
        logger.success(`${registryName} からログアウトしました (${dest})`);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`ログアウト失敗: ${error.message}`);
        }
        process.exit(1);
      }
    });
}
