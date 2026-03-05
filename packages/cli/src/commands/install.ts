import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { validateSnippetName } from "../lib/validate-name.js";
import {
  loadMirConfig,
  resolveInstallRegistries,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import {
  snippetExistsInRegistry,
  readSnippetFromRegistry,
  listRegistrySnippets,
} from "../lib/registry.js";
import { expandTemplateDirectory } from "../lib/template-engine.js";
import { executeHooks } from "../lib/hooks.js";
import { MirError, SnippetNotFoundError } from "../lib/errors.js";
import { prompt, selectWithSuggests } from "../lib/prompt.js";
import { selectSnippet } from "../lib/snippet-list.js";
import * as logger from "../lib/logger.js";
import type { SnippetDefinition, VariableDefinition } from "../lib/snippet-schema.js";

export interface InstallOptions {
  registry?: string;
  outDir?: string;
}

export async function installSnippet(
  name: string,
  variableArgs: Record<string, string>,
  opts: InstallOptions = {},
  cwd: string = process.cwd(),
  configPath?: string,
): Promise<void> {
  validateSnippetName(name);

  const config = loadMirConfig(configPath ? { configPath } : { cwd });
  const registries = resolveInstallRegistries(config, opts.registry);

  let foundRegistryPath: string | undefined;
  let definition: SnippetDefinition | undefined;

  for (const entry of registries) {
    if (!entry.path) {
      // TODO: リモート registry 対応
      continue;
    }
    const regPath = resolveRegistryPath(entry);
    if (snippetExistsInRegistry(regPath, name)) {
      foundRegistryPath = regPath;
      definition = readSnippetFromRegistry(regPath, name);
      break;
    }
  }

  if (!foundRegistryPath || !definition) {
    throw new SnippetNotFoundError(name);
  }

  const variableDefs = definition.variables ?? {};
  const variables = await resolveVariables(variableDefs, variableArgs);

  // 変数一覧を表示
  logVariableSummary(name, variableDefs, variables, variableArgs);

  if (definition.hooks?.["before-install"]?.length) {
    const updatedVars = executeHooks(
      definition.hooks["before-install"],
      variables,
    );
    Object.assign(variables, updatedVars);
  }

  const expandedFiles = expandTemplateDirectory(
    foundRegistryPath,
    name,
    variables,
  );

  const outDir = opts.outDir
    ? path.resolve(cwd, opts.outDir)
    : cwd;

  for (const [filePath, content] of expandedFiles) {
    const fullPath = path.join(outDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }

  if (definition.hooks?.["after-install"]?.length) {
    executeHooks(definition.hooks["after-install"], variables);
  }

  logger.success(`Snippet "${name}" をインストールしました`);
  for (const filePath of expandedFiles.keys()) {
    const displayPath = opts.outDir
      ? path.join(opts.outDir, filePath)
      : filePath;
    logger.fileItem(displayPath);
  }
}

function logVariableSummary(
  name: string,
  variableDefs: Record<string, VariableDefinition>,
  variables: Record<string, unknown>,
  variableArgs: Record<string, string>,
): void {
  logger.info(`Snippet "${name}"`);

  const keys = Object.keys(variableDefs);
  if (keys.length === 0) return;

  logger.step("Variables:");
  for (const key of keys) {
    const def = variableDefs[key];
    const value = String(variables[key]);
    const isDefault =
      !(key in variableArgs) && def.schema?.default !== undefined;
    const suffix = isDefault ? " (default)" : "";
    logger.label(key, `${value}${suffix}`);
  }
}

async function resolveVariables(
  variableDefs: Record<string, VariableDefinition>,
  args: Record<string, string>,
): Promise<Record<string, unknown>> {
  const variables: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(variableDefs)) {
    if (key in args) {
      variables[key] = coerceValue(args[key], def.schema?.type);
    } else if (def.suggests?.length) {
      const description = def.description ?? def.name ?? key;
      const allowManual =
        def.schema?.type === "string" || !def.schema?.type;
      const defaultStr =
        def.schema?.default !== undefined
          ? String(def.schema.default)
          : undefined;
      const answer = await selectWithSuggests({
        question: `${description} (${key})`,
        suggests: def.suggests,
        allowManualInput: allowManual,
        defaultValue: defaultStr,
      });
      variables[key] = coerceValue(answer, def.schema?.type);
    } else if (def.schema?.default !== undefined) {
      variables[key] = def.schema.default;
    } else {
      const description = def.description ?? def.name ?? key;
      const answer = await prompt(`${description} (${key}): `);
      if (answer === "") {
        throw new MirError(
          `変数 "${key}" の値が入力されませんでした`,
        );
      }
      variables[key] = coerceValue(answer, def.schema?.type);
    }
  }

  // variableDefs に定義のない引数もそのまま渡す
  for (const [key, value] of Object.entries(args)) {
    if (!(key in variables)) {
      variables[key] = value;
    }
  }

  return variables;
}

function coerceValue(
  value: string,
  type?: "string" | "number" | "boolean",
): unknown {
  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "true" || value === "1";
    default:
      return value;
  }
}

export function parseVariableArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

export function registerInstallCommand(program: Command): void {
  program
    .command("install [name]")
    .alias("i")
    .description("snippet を registry からインストールする")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .option("-o, --out-dir <path>", "出力先ディレクトリ")
    .allowUnknownOption(true)
    .action(async (name: string | undefined, opts: InstallOptions, cmd) => {
      let snippetName = name;
      if (!snippetName) {
        const config = loadMirConfig({ cwd: process.cwd() });
        const registries = resolveInstallRegistries(config, opts.registry);
        const allSnippets: string[] = [];
        for (const entry of registries) {
          if (!entry.path) continue;
          const regPath = resolveRegistryPath(entry);
          const snippets = listRegistrySnippets(regPath);
          for (const s of snippets) {
            if (!allSnippets.includes(s)) {
              allSnippets.push(s);
            }
          }
        }
        snippetName = await selectSnippet(allSnippets);
      }
      const rawArgs: string[] = cmd.args.slice(0);
      const variableArgs = parseVariableArgs(rawArgs);
      await installSnippet(snippetName, variableArgs, opts);
    });
}
