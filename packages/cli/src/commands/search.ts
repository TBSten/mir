import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import {
  listRemoteSnippets,
  listRegistrySnippets,
  t,
} from "@tbsten/mir-core";
import { loadMirConfig, resolveInstallRegistries, resolveRegistryPath, resolveRegistryUrl } from "../lib/mirconfig.js";
import * as logger from "../lib/logger.js";

interface GlobalOptions {
  json?: boolean;
  yaml?: boolean;
  quiet?: boolean;
}

interface SearchOptions extends GlobalOptions {
  registry?: string;
}

interface RegistrySearchResult {
  name: string;
  type: "local" | "remote";
  path?: string;
  url?: string;
  snippets: string[];
}

export async function searchSnippets(query: string, opts: SearchOptions = {}): Promise<void> {
  if (!query) {
    if (!opts.quiet) {
      logger.warn(t("search.query-required"));
    }
    return;
  }

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
    const resultList: RegistrySearchResult[] = [];

    for (const entry of registries) {
      if (entry.url) {
        const result: RegistrySearchResult = {
          name: entry.name ?? "remote",
          type: "remote",
          url: entry.url,
          snippets: [],
        };
        try {
          const allSnippets = await listRemoteSnippets(resolveRegistryUrl(entry));
          const lowerQuery = query.toLowerCase();
          result.snippets = allSnippets.filter((name) =>
            name.toLowerCase().includes(lowerQuery),
          );
        } catch {
          // 検索失敗時は空配列のまま
        }
        resultList.push(result);
      } else if (entry.path) {
        const regPath = resolveRegistryPath(entry);
        const result: RegistrySearchResult = {
          name: entry.name ?? "local",
          type: "local",
          path: regPath,
          snippets: [],
        };

        if (fs.existsSync(regPath)) {
          try {
            const allSnippets = listRegistrySnippets(regPath);
            const lowerQuery = query.toLowerCase();
            result.snippets = allSnippets.filter((name) =>
              name.toLowerCase().includes(lowerQuery),
            );
          } catch {
            // 読み込み失敗時は空配列のまま
          }
        }
        resultList.push(result);
      }
    }

    logger.infoForOutput({ query, results: resultList });
    return;
  }

  // 人間向け出力モード
  let foundAny = false;

  for (const entry of registries) {
    if (entry.url) {
      try {
        const allSnippets = await listRemoteSnippets(entry.url);
        const lowerQuery = query.toLowerCase();
        const searchResults = allSnippets.filter((name) =>
          name.toLowerCase().includes(lowerQuery),
        );
        if (searchResults.length > 0) {
          if (!opts.quiet) {
            logger.step(`${entry.name ?? "remote"} (${entry.url}):`);
            for (const name of searchResults) {
              logger.fileItem(name);
            }
          }
          foundAny = true;
        }
      } catch {
        if (!opts.quiet) {
          logger.warn(`  (検索失敗: ${entry.name ?? entry.url})`);
        }
      }
    } else if (entry.path) {
      const regPath = resolveRegistryPath(entry);

      if (fs.existsSync(regPath)) {
        try {
          const allSnippets = listRegistrySnippets(regPath);
          const lowerQuery = query.toLowerCase();
          const searchResults = allSnippets.filter((name) =>
            name.toLowerCase().includes(lowerQuery),
          );

          if (searchResults.length > 0) {
            if (!opts.quiet) {
              logger.step(`${entry.name ?? "local"} (${regPath}):`);
              for (const name of searchResults) {
                logger.fileItem(name);
              }
            }
            foundAny = true;
          }
        } catch {
          if (!opts.quiet) {
            logger.warn(`  (読み込み失敗)`);
          }
        }
      }
    }
  }

  if (!foundAny && !opts.quiet) {
    logger.warn(t("search.no-results", { query }));
  }
}

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("snippet をキーワードで検索する")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .option("--json", "JSON 形式で出力")
    .option("--yaml", "YAML 形式で出力")
    .option("--quiet", "ログ出力を抑制")
    .action(async (query: string, opts: SearchOptions) => {
      await searchSnippets(query, opts);
    })
    .addHelpText("after", `
Examples:
  mir search react
  mir search component --registry custom
  mir search hook --json
  mir search template --quiet`);
}
