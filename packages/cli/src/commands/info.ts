import type { Command } from "commander";
import yaml from "js-yaml";
import {
  validateSnippetName,
  snippetExistsInRegistry,
  readSnippetFromRegistry,
  fetchRemoteSnippet,
  listRemoteSnippets,
  listRegistrySnippets,
  SnippetNotFoundError,
  t,
  type SnippetDefinition,
  type VariableDefinition,
  type FetchOptions,
} from "@tbsten/mir-core";
import {
  loadMirConfig,
  resolveInstallRegistries,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import { selectSnippet } from "../lib/snippet-list.js";
import * as logger from "../lib/logger.js";

interface InfoOptions {
  registry?: string;
  json?: boolean;
  yaml?: boolean;
  quiet?: boolean;
  /** リモート registry へのタイムアウト秒数 */
  timeout?: number;
}

export async function showSnippetInfo(name: string | undefined, opts: InfoOptions = {}, configPath?: string): Promise<void> {
  let snippetName = name;

  const fetchOptions: FetchOptions = opts.timeout
    ? { timeoutMs: opts.timeout * 1000 }
    : {};

  // パラメータが省略されている場合は snippet 選択
  if (!snippetName) {
    const config = loadMirConfig(configPath ? { configPath } : undefined);
    const registries = resolveInstallRegistries(config, opts.registry);
    const allSnippets: string[] = [];

    for (const entry of registries) {
      if (entry.url) {
        try {
          const remoteNames = await listRemoteSnippets(entry.url, fetchOptions);
          for (const s of remoteNames) {
            if (!allSnippets.includes(s)) {
              allSnippets.push(s);
            }
          }
        } catch {
          logger.warn(`Registry "${entry.name ?? entry.url}" の一覧取得に失敗しました`);
        }
      } else if (entry.path) {
        const regPath = resolveRegistryPath(entry);
        const snippets = listRegistrySnippets(regPath);
        for (const s of snippets) {
          if (!allSnippets.includes(s)) {
            allSnippets.push(s);
          }
        }
      }
    }

    snippetName = await selectSnippet(allSnippets);
  }

  validateSnippetName(snippetName);

  const config = loadMirConfig(configPath ? { configPath } : undefined);
  const registries = resolveInstallRegistries(config, opts.registry);

  let definition: SnippetDefinition | undefined;

  for (const entry of registries) {
    if (entry.url) {
      try {
        const remote = await fetchRemoteSnippet(entry.url, snippetName, fetchOptions);
        definition = remote.definition;
        break;
      } catch {
        continue;
      }
    } else if (entry.path) {
      const regPath = resolveRegistryPath(entry);
      if (snippetExistsInRegistry(regPath, snippetName)) {
        definition = readSnippetFromRegistry(regPath, snippetName);
        break;
      }
    }
  }

  if (!definition) {
    throw new SnippetNotFoundError(snippetName);
  }

  // JSON/YAML 出力の場合
  if (opts.json || opts.yaml) {
    const output = {
      name: definition.name,
      description: definition.description,
      variables: Object.entries(definition.variables ?? {}).reduce((acc, [key, def]) => {
        acc[key] = {
          name: def.name ?? key,
          description: def.description ?? "",
          type: def.schema?.type ?? "string",
          ...(def.schema?.default !== undefined && { default: def.schema.default }),
          ...(def.schema?.default === undefined && { required: true }),
          ...(def.suggests && def.suggests.length > 0 && { suggests: def.suggests }),
        };
        return acc;
      }, {} as Record<string, unknown>),
    };

    if (opts.yaml) {
      console.log(yaml.dump(output));
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
    return;
  }

  // 人間向けの出力
  logger.info(`Snippet: ${snippetName}\n`);

  if (definition.description) {
    logger.step("Description:");
    logger.info(`  ${definition.description}\n`);
  }

  const variables = definition.variables ?? {};
  const keys = Object.keys(variables);

  if (keys.length === 0) {
    logger.info("No variables required\n");
    return;
  }

  logger.step("Variables:");
  for (const key of keys) {
    const def = variables[key];
    const description = def.description ?? def.name ?? key;
    const hasDefault = def.schema?.default !== undefined;
    const defaultValue = def.schema?.default;
    const defaultStr = hasDefault ? ` (default: ${defaultValue})` : " (required)";
    const typeStr = def.schema?.type ? ` [${def.schema.type}]` : "";

    logger.info(`  ${key}${typeStr}:`);
    logger.info(`    ${description}${defaultStr}`);

    if (def.suggests?.length) {
      logger.info(`    Options: ${def.suggests.join(", ")}`);
    }
  }
  logger.info("");
}

export function registerInfoCommand(program: Command): void {
  program
    .command("info [name]")
    .description("snippet の詳細情報を表示する")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .option("--json", "JSON 形式で出力する")
    .option("--yaml", "YAML 形式で出力する")
    .option("-q, --quiet", "ログ出力を抑制する")
    .option("--timeout <seconds>", "リモート registry へのタイムアウト秒数", parseInt)
    .addHelpText("after", `
Examples:
  mir info react-hook
  mir info react-hook --json
  mir info react-hook --yaml
  mir info --registry custom
  mir info react-hook --timeout=10`)
    .action(async (name: string | undefined, opts: InfoOptions) => {
      await showSnippetInfo(name, opts);
    });
}
