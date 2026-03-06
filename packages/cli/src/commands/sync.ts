import type { Command } from "commander";
import fs from "node:fs";
import {
  validateSnippetName,
  parseSnippetYaml,
  serializeSnippetYaml,
  extractVariablesFromDirectory,
  SnippetNotFoundError,
  t,
} from "@mir/core";
import { snippetYamlPath, snippetDirPath } from "../lib/paths.js";
import { listLocalSnippets, selectSnippet } from "../lib/snippet-list.js";
import * as logger from "../lib/logger.js";

export function syncSnippet(
  name: string,
  cwd: string = process.cwd(),
): void {
  validateSnippetName(name);

  const yamlPath = snippetYamlPath(cwd, name);
  if (!fs.existsSync(yamlPath)) {
    throw new SnippetNotFoundError(name);
  }

  const dirPath = snippetDirPath(cwd, name);
  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const definition = parseSnippetYaml(yamlContent);

  const templateVars = extractVariablesFromDirectory(dirPath);
  const existingVars = Object.keys(definition.variables ?? {});

  const newVars = templateVars.filter((v) => !existingVars.includes(v));
  if (newVars.length === 0) {
    logger.info(t("sync.no-new-vars"));
    return;
  }

  if (!definition.variables) {
    definition.variables = {};
  }

  for (const varName of newVars) {
    definition.variables[varName] = {
      schema: { type: "string" },
    };
  }

  fs.writeFileSync(yamlPath, serializeSnippetYaml(definition), "utf-8");

  logger.success(t("sync.success", { count: newVars.length }));
  for (const varName of newVars) {
    logger.label(varName, "string");
  }
}

export function registerSyncCommand(program: Command): void {
  program
    .command("sync [name]")
    .description("テンプレートの変数を snippet 定義に同期する")
    .addHelpText("after", `
Examples:
  mir sync react-hook
  mir sync`)
    .action(async (name: string | undefined) => {
      let snippetName = name;
      if (!snippetName) {
        const snippets = listLocalSnippets(process.cwd());
        snippetName = await selectSnippet(snippets);
      }
      syncSnippet(snippetName);
    });
}
