import type { Command } from "commander";
import fs from "node:fs";
import { validateSnippetName } from "../lib/validate-name.js";
import { snippetYamlPath, snippetDirPath } from "../lib/paths.js";
import { parseSnippetYaml } from "../lib/snippet-schema.js";
import {
  loadMirConfig,
  resolvePublishRegistry,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import {
  snippetExistsInRegistry,
  copySnippetToRegistry,
  removeSnippetFromRegistry,
} from "../lib/registry.js";
import {
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
} from "../lib/errors.js";
import * as logger from "../lib/logger.js";

export interface PublishOptions {
  registry?: string;
  force?: boolean;
}

export function publishSnippet(
  name: string,
  opts: PublishOptions = {},
  cwd: string = process.cwd(),
  configPath?: string,
): void {
  validateSnippetName(name);

  const yamlPath = snippetYamlPath(cwd, name);
  if (!fs.existsSync(yamlPath)) {
    throw new SnippetNotFoundError(name);
  }

  const dirPath = snippetDirPath(cwd, name);
  if (!fs.existsSync(dirPath)) {
    throw new SnippetNotFoundError(name);
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  parseSnippetYaml(yamlContent);

  const config = loadMirConfig(configPath ? { configPath } : { cwd });
  const registryEntry = resolvePublishRegistry(config, opts.registry);
  const registryPath = resolveRegistryPath(registryEntry);

  if (snippetExistsInRegistry(registryPath, name)) {
    if (!opts.force) {
      throw new SnippetAlreadyExistsError(name);
    }
    removeSnippetFromRegistry(registryPath, name);
  }

  copySnippetToRegistry(dirPath, yamlPath, registryPath, name);

  logger.success(`Snippet "${name}" を registry に登録しました`);
}

export function registerPublishCommand(program: Command): void {
  program
    .command("publish <name>")
    .description("snippet をローカル registry に登録する")
    .option("-r, --registry <name>", "登録先 registry の名前")
    .option("-f, --force", "既存の snippet を上書き", false)
    .action((name: string, opts: PublishOptions) => {
      publishSnippet(name, opts);
    });
}
