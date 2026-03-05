import { Command } from "commander";
import { MirError, setLocale, type Locale } from "@mir/core";
import { registerCreateCommand } from "./commands/create.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerSyncCommand } from "./commands/sync.js";
import { loadMirConfig } from "./lib/mirconfig.js";
import * as logger from "./lib/logger.js";

// config から locale を初期化
try {
  const config = loadMirConfig();
  if (config.locale) {
    setLocale(config.locale);
  }
} catch {
  // 設定ファイルの読み込みに失敗しても続行
}

const program = new Command();

program
  .name("mir")
  .description("スニペットを配布・取得する CLI ツール")
  .version("0.0.1")
  .showHelpAfterError(true);

registerCreateCommand(program);
registerPublishCommand(program);
registerInstallCommand(program);
registerSyncCommand(program);

program.parseAsync().catch((err) => {
  if (err instanceof MirError) {
    logger.error(err.message);
    process.exit(1);
  }
  throw err;
});
