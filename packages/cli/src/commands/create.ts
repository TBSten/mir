import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { validateSnippetName } from "../lib/validate-name.js";
import { snippetYamlPath, snippetDirPath, snippetsBasePath } from "../lib/paths.js";
import { serializeSnippetYaml, type SnippetDefinition } from "../lib/snippet-schema.js";
import { SnippetAlreadyExistsError } from "../lib/errors.js";
import { prompt } from "../lib/prompt.js";
import * as logger from "../lib/logger.js";

export interface CreateOptions {
  description?: string;
}

export function createSnippet(
  name: string,
  opts: CreateOptions = {},
  cwd: string = process.cwd(),
): void {
  validateSnippetName(name);

  const yamlPath = snippetYamlPath(cwd, name);
  if (fs.existsSync(yamlPath)) {
    throw new SnippetAlreadyExistsError(name);
  }

  const basePath = snippetsBasePath(cwd);
  fs.mkdirSync(basePath, { recursive: true });

  const def: SnippetDefinition = {
    name,
    description: opts.description ?? "",
    variables: {},
    hooks: {
      "before-install": [],
      "after-install": [],
    },
  };

  fs.writeFileSync(yamlPath, serializeSnippetYaml(def), "utf-8");

  const dirPath = snippetDirPath(cwd, name);
  fs.mkdirSync(dirPath, { recursive: true });

  logger.success(`Snippet "${name}" を作成しました`);
  logger.fileItem(path.relative(cwd, yamlPath));
  logger.dirItem(`${path.relative(cwd, dirPath)}/`);
}

export function registerCreateCommand(program: Command): void {
  program
    .command("create [name]")
    .description("snippet の雛形を作成する")
    .option("-d, --description <description>", "snippet の説明文", "")
    .action(async (name: string | undefined, opts: CreateOptions) => {
      const snippetName = name ?? await prompt("snippet 名: ");
      createSnippet(snippetName, opts);
    });
}
