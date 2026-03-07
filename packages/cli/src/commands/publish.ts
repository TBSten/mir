import type { Command } from "commander";
import fs from "node:fs";
import {
  validateSnippetName,
  parseSnippetYaml,
  snippetExistsInRegistry,
  copySnippetToRegistry,
  removeSnippetFromRegistry,
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  t,
} from "@tbsten/mir-core";
import { snippetYamlPath, snippetDirPath } from "../lib/paths.js";
import {
  loadMirConfig,
  resolvePublishRegistry,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import { publishToRemoteRegistry } from "../lib/remote-publish.js";
import { confirm } from "../lib/prompt.js";
import { listLocalSnippets, selectSnippet } from "../lib/snippet-list.js";
import * as logger from "../lib/logger.js";

export interface PublishOptions {
  registry?: string;
  force?: boolean;
  interactive?: boolean;
}

export async function publishSnippet(
  name: string,
  opts: PublishOptions = {},
  cwd: string = process.cwd(),
  configPath?: string,
): Promise<void> {
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
  const definition = parseSnippetYaml(yamlContent);

  const config = loadMirConfig(configPath ? { configPath } : { cwd });
  const registryEntry = resolvePublishRegistry(config, opts.registry);

  // リモート registry の場合
  if (registryEntry.url) {
    if (!registryEntry.publish_token) {
      throw new Error(t("error.publish-token-required"));
    }

    // ファイルを読み込み
    const files: Record<string, string> = {};
    const templateDir = dirPath;
    if (fs.existsSync(templateDir)) {
      const readDir = (dir: string, prefix = "") => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const filePath = `${prefix}${entry.name}`;
          if (entry.isDirectory()) {
            readDir(`${dir}/${entry.name}`, `${filePath}/`);
          } else {
            files[filePath] = fs.readFileSync(`${dir}/${entry.name}`, "utf-8");
          }
        }
      };
      readDir(templateDir);
    }

    // リモート publish
    await publishToRemoteRegistry(registryEntry.url, registryEntry.publish_token, {
      definition,
      files,
      force: opts.force,
    }, t);

    logger.success(t("publish.success", { name }));
    return;
  }

  // ローカル registry の場合
  const registryPath = resolveRegistryPath(registryEntry);

  if (snippetExistsInRegistry(registryPath, name)) {
    if (opts.force) {
      removeSnippetFromRegistry(registryPath, name);
    } else if (opts.interactive !== false) {
      const shouldOverwrite = await confirm(
        t("publish.confirm-overwrite", { name }),
      );
      if (!shouldOverwrite) {
        logger.info(t("publish.cancelled"));
        return;
      }
      removeSnippetFromRegistry(registryPath, name);
    } else {
      throw new SnippetAlreadyExistsError(name);
    }
  }

  copySnippetToRegistry(dirPath, yamlPath, registryPath, name);

  logger.success(t("publish.success", { name }));
}

export function registerPublishCommand(program: Command): void {
  program
    .command("publish [name]")
    .description("snippet をローカル registry に登録する")
    .option("-r, --registry <name>", "登録先 registry の名前")
    .option("-f, --force", "既存の snippet を上書き", false)
    .option("--no-interactive", "対話的な確認を無効化する")
    .addHelpText("after", `
Examples:
  mir publish react-hook
  mir publish react-hook --force
  mir publish my-component --registry custom
  mir publish react-hook --no-interactive`)
    .action(async (name: string | undefined, opts: PublishOptions) => {
      let snippetName = name;
      if (!snippetName) {
        const snippets = listLocalSnippets(process.cwd());
        snippetName = await selectSnippet(snippets);
      }
      await publishSnippet(snippetName, opts);
    });
}
