import { Command } from "commander";
import { MirError, SnippetNotFoundError, setLocale, type Locale } from "@tbsten/mir-core";
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
import { registerLoginCommand } from "./commands/login.js";
import { registerLogoutCommand } from "./commands/logout.js";
import { registerValidateCommand } from "./commands/validate.js";
import { loadMirConfig } from "./lib/mirconfig.js";
import { getLocaleFromEnv } from "./lib/env.js";
import * as logger from "./lib/logger.js";

declare const __PKG_VERSION__: string;

const program = new Command();

program
  .name("mir")
  .description("スニペットを配布・取得する CLI ツール")
  .version(__PKG_VERSION__, "-v, --version")
  .showHelpAfterError(true)
  .option("--config <path>", "設定ファイルパス (デフォルト: ~/.mir/config.yaml)")
  .option("--locale <lang>", "UI 言語 (ja|en)")
  .option("--no-interactive", "非対話モード")
  .configureHelp({
    formatHelp(cmd, helper) {
      const bold = "\x1b[1m";
      const cyan = "\x1b[36m";
      const yellow = "\x1b[33m";
      const dim = "\x1b[2m";
      const reset = "\x1b[0m";

      const title = `${bold}${cyan}${cmd.name()}${reset}`;
      const desc = cmd.description();
      const lines: string[] = [];

      lines.push(`${title}${desc ? ` - ${desc}` : ""}`);
      lines.push("");

      // Usage
      const usage = helper.commandUsage(cmd);
      lines.push(`${bold}Usage:${reset}  ${usage}`);
      lines.push("");

      // Commands
      const cmds = helper.visibleCommands(cmd);
      if (cmds.length > 0) {
        lines.push(`${bold}Commands:${reset}`);
        const padWidth = helper.padWidth(cmd, helper);
        for (const sub of cmds) {
          const name = helper.subcommandTerm(sub).padEnd(padWidth);
          const subDesc = helper.subcommandDescription(sub);
          lines.push(`  ${cyan}${name}${reset}  ${dim}${subDesc}${reset}`);
        }
        lines.push("");
      }

      // Options
      const opts = helper.visibleOptions(cmd);
      if (opts.length > 0) {
        lines.push(`${bold}Options:${reset}`);
        const padWidth = helper.padWidth(cmd, helper);
        for (const opt of opts) {
          const flags = helper.optionTerm(opt).padEnd(padWidth);
          const optDesc = helper.optionDescription(opt);
          lines.push(`  ${yellow}${flags}${reset}  ${dim}${optDesc}${reset}`);
        }
        lines.push("");
      }

      return lines.join("\n");
    },
  });

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
registerValidateCommand(program);
registerLoginCommand(program);
registerLogoutCommand(program);

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
