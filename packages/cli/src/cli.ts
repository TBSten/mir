import { Command } from "commander";
import { registerCreateCommand } from "./commands/create.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerSyncCommand } from "./commands/sync.js";
import { MirError } from "./lib/errors.js";
import * as logger from "./lib/logger.js";

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
