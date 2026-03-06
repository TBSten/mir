import type { Command } from "commander";
import {
  validateSnippetName,
  snippetExistsInRegistry,
  readSnippetFromRegistry,
  fetchRemoteSnippet,
  SnippetNotFoundError,
  t,
  type SnippetDefinition,
  type VariableDefinition,
} from "@mir/core";
import {
  loadMirConfig,
  resolveInstallRegistries,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import * as logger from "../lib/logger.js";

interface InfoOptions {
  registry?: string;
}

async function showSnippetInfo(name: string, opts: InfoOptions = {}): Promise<void> {
  validateSnippetName(name);

  const config = loadMirConfig();
  const registries = resolveInstallRegistries(config, opts.registry);

  let definition: SnippetDefinition | undefined;

  for (const entry of registries) {
    if (entry.url) {
      try {
        const remote = await fetchRemoteSnippet(entry.url, name);
        definition = remote.definition;
        break;
      } catch {
        continue;
      }
    } else if (entry.path) {
      const regPath = resolveRegistryPath(entry);
      if (snippetExistsInRegistry(regPath, name)) {
        definition = readSnippetFromRegistry(regPath, name);
        break;
      }
    }
  }

  if (!definition) {
    throw new SnippetNotFoundError(name);
  }

  // Snippet 情報を表示
  logger.info(`Snippet: ${name}\n`);

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
    .command("info <name>")
    .description("snippet の詳細情報を表示する")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .action(async (name: string, opts: InfoOptions) => {
      await showSnippetInfo(name, opts);
    });
}
