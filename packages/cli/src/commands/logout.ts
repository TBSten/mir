import type { Command } from "commander";
import { removeRegistryToken } from "../lib/mirconfig.js";
import * as logger from "../lib/logger.js";

export function registerLogoutCommand(program: Command): void {
  program
    .command("logout")
    .description("registry からログアウト（保存された token を削除）")
    .option("--registry <name>", "対象 registry 名 (デフォルト: official)")
    .action(async (opts) => {
      const registryName = opts.registry || "official";

      try {
        removeRegistryToken(registryName);
        logger.success(`${registryName} からログアウトしました`);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`ログアウト失敗: ${error.message}`);
        }
        process.exit(1);
      }
    });
}
