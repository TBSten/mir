import type { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import {
  listRegistrySnippets,
  listRemoteSnippets,
  t,
  type SnippetDefinition,
} from "@mir/core";
import { loadMirConfig, resolveInstallRegistries, resolveRegistryPath } from "../lib/mirconfig.js";
import * as logger from "../lib/logger.js";

interface ListOptions {
  registry?: string;
}

async function listSnippets(opts: ListOptions = {}): Promise<void> {
  const config = loadMirConfig();
  const registries = resolveInstallRegistries(config, opts.registry);

  if (registries.length === 0) {
    logger.warn(t("error.no-snippets"));
    return;
  }

  logger.info("Available snippets:\n");

  for (const entry of registries) {
    if (entry.url) {
      logger.step(`${entry.name ?? "remote"} (${entry.url}):`);
      try {
        const remoteSnippets = await listRemoteSnippets(entry.url);
        for (const name of remoteSnippets) {
          logger.fileItem(name);
        }
      } catch {
        logger.warn(`  (取得失敗)`);
      }
    } else if (entry.path) {
      const regPath = resolveRegistryPath(entry);
      logger.step(`${entry.name ?? "local"} (${regPath}):`);

      if (!fs.existsSync(regPath)) {
        logger.warn("  (registry ディレクトリが見つかりません)");
        continue;
      }

      try {
        const localSnippets = listRegistrySnippets(regPath);
        if (localSnippets.length === 0) {
          logger.warn("  (snippet がありません)");
        } else {
          for (const name of localSnippets) {
            logger.fileItem(name);
          }
        }
      } catch {
        logger.warn("  (読み込み失敗)");
      }
    }
  }
}

export function registerListCommand(program: Command): void {
  program
    .command("list [name]")
    .alias("ls")
    .description("利用可能な snippet を一覧表示する")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .action(async (name: string | undefined, opts: ListOptions) => {
      await listSnippets(opts);
    });
}
