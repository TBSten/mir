import type { Command } from "commander";
import path from "node:path";
import fs from "node:fs";
import {
  listRegistrySnippets,
  listRemoteSnippets,
  t,
} from "@mir/core";
import { loadMirConfig, resolveInstallRegistries, resolveRegistryPath } from "../lib/mirconfig.js";
import * as logger from "../lib/logger.js";

interface GlobalOptions {
  json?: boolean;
  yaml?: boolean;
  quiet?: boolean;
}

interface ListOptions extends GlobalOptions {
  registry?: string;
}

interface RegistryData {
  name: string;
  type: "local" | "remote";
  path?: string;
  url?: string;
  snippets: string[];
}

export async function listSnippets(opts: ListOptions = {}): Promise<void> {
  const config = loadMirConfig();
  const registries = resolveInstallRegistries(config, opts.registry);

  if (registries.length === 0) {
    if (!opts.quiet) {
      logger.warn(t("error.no-snippets"));
    }
    return;
  }

  // JSON/YAML 出力モード
  if (opts.json || opts.yaml) {
    const registryDataList: RegistryData[] = [];

    for (const entry of registries) {
      if (entry.url) {
        const regData: RegistryData = {
          name: entry.name ?? "remote",
          type: "remote",
          url: entry.url,
          snippets: [],
        };
        try {
          regData.snippets = await listRemoteSnippets(entry.url);
        } catch {
          // 取得失敗時は空配列のまま
        }
        registryDataList.push(regData);
      } else if (entry.path) {
        const regPath = resolveRegistryPath(entry);
        const regData: RegistryData = {
          name: entry.name ?? "local",
          type: "local",
          path: regPath,
          snippets: [],
        };

        if (fs.existsSync(regPath)) {
          try {
            regData.snippets = listRegistrySnippets(regPath);
          } catch {
            // 読み込み失敗時は空配列のまま
          }
        }
        registryDataList.push(regData);
      }
    }

    logger.infoForOutput({ registries: registryDataList });
    return;
  }

  // 人間向け出力モード
  if (!opts.quiet) {
    logger.info("Available snippets:\n");
  }

  for (const entry of registries) {
    if (entry.url) {
      if (!opts.quiet) {
        logger.step(`${entry.name ?? "remote"} (${entry.url}):`);
      }
      try {
        const remoteSnippets = await listRemoteSnippets(entry.url);
        for (const name of remoteSnippets) {
          if (!opts.quiet) {
            logger.fileItem(name);
          }
        }
      } catch {
        if (!opts.quiet) {
          logger.warn(`  (取得失敗)`);
        }
      }
    } else if (entry.path) {
      const regPath = resolveRegistryPath(entry);
      if (!opts.quiet) {
        logger.step(`${entry.name ?? "local"} (${regPath}):`);
      }

      if (!fs.existsSync(regPath)) {
        if (!opts.quiet) {
          logger.warn("  (registry ディレクトリが見つかりません)");
        }
        continue;
      }

      try {
        const localSnippets = listRegistrySnippets(regPath);
        if (localSnippets.length === 0) {
          if (!opts.quiet) {
            logger.warn("  (snippet がありません)");
          }
        } else {
          for (const name of localSnippets) {
            if (!opts.quiet) {
              logger.fileItem(name);
            }
          }
        }
      } catch {
        if (!opts.quiet) {
          logger.warn("  (読み込み失敗)");
        }
      }
    }
  }
}

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .alias("ls")
    .description("利用可能な snippet を一覧表示する")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .option("--json", "JSON 形式で出力")
    .option("--yaml", "YAML 形式で出力")
    .option("--quiet", "ログ出力を抑制")
    .action(async (opts: ListOptions) => {
      await listSnippets(opts);
    });
}
