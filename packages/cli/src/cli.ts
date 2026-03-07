import { Command } from "commander";
import { MirError, SnippetNotFoundError, setLocale, type Locale } from "@mir/core";
import { registerCreateCommand } from "./commands/create.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerSyncCommand } from "./commands/sync.js";
import { registerListCommand } from "./commands/list.js";
import { registerInfoCommand } from "./commands/info.js";
import { registerInitCommand } from "./commands/init.js";
import { registerPreviewCommand } from "./commands/preview.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerCloneCommand } from "./commands/clone.js";
import { loadMirConfig } from "./lib/mirconfig.js";
import { getLocaleFromEnv } from "./lib/env.js";
import * as logger from "./lib/logger.js";

const program = new Command();

program
  .name("mir")
  .description("スニペットを配布・取得する CLI ツール")
  .version("0.0.1-alpha")
  .showHelpAfterError(true)
  .option("--config <path>", "設定ファイルパス (デフォルト: ~/.mir/config.yaml)")
  .option("--locale <lang>", "UI 言語 (ja|en)")
  .option("--no-interactive", "非対話モード");

// CLI オプション、環境変数、config ファイルから locale を解決
const opts = program.opts();
let locale: Locale = "en";

if (opts.locale) {
  const cliLocale = opts.locale as string;
  if (cliLocale === "ja" || cliLocale === "en") {
    locale = cliLocale;
  }
} else {
  const envLocale = getLocaleFromEnv();
  if (envLocale) {
    locale = envLocale;
  } else {
    try {
      const configPath = opts.config ? opts.config : undefined;
      const config = loadMirConfig(configPath ? { configPath } : undefined);
      if (config.locale) {
        locale = config.locale;
      }
    } catch {
      // 設定ファイルの読み込みに失敗してもデフォルト値を使用
    }
  }
}

setLocale(locale);

registerInitCommand(program);
registerCreateCommand(program);
registerPublishCommand(program);
registerInstallCommand(program);
registerSyncCommand(program);
registerListCommand(program);
registerInfoCommand(program);
registerSearchCommand(program);
registerCloneCommand(program);
registerPreviewCommand(program);

program.parseAsync().catch((err) => {
  if (err instanceof SnippetNotFoundError) {
    logger.error(err.message);
    logger.info(err.details);
    process.exit(1);
  }
  if (err instanceof MirError) {
    logger.error(err.message);
    process.exit(1);
  }
  throw err;
});
