import type { Command } from "commander";
import {
  validateSnippetName,
  snippetExistsInRegistry,
  readSnippetFromRegistry,
  expandTemplateDirectory,
  expandRemoteTemplateFiles,
  fetchRemoteSnippet,
  MirError,
  SnippetNotFoundError,
  t,
  type SnippetDefinition,
  type FetchOptions,
} from "@mir/core";
import {
  loadMirConfig,
  resolveInstallRegistries,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import { prompt } from "../lib/prompt.js";
import * as logger from "../lib/logger.js";
import { getBuiltinVariables } from "./install.js";

export interface PreviewOptions {
  registry?: string;
  interactive?: boolean;
  output?: boolean;
  json?: boolean;
  quiet?: boolean;
  timeout?: number;
}

export interface PreviewResult {
  success: boolean;
  snippet: string;
  variables?: Record<string, unknown>;
  files?: string[];
  expandedContent?: Record<string, string>;
  error?: string;
}

/**
 * スニペットのプレビューを表示する
 * @param name - スニペット名
 * @param opts - オプション
 * @param variableArgs - 変数の事前設定値
 * @param cwd - 作業ディレクトリ
 * @param configPath - 設定ファイルパス
 * @param interactive - 対話モードかどうか (デフォルト: false)
 */
export async function previewSnippet(
  name: string,
  opts: PreviewOptions = {},
  variableArgs: Record<string, string> = {},
  cwd: string = process.cwd(),
  configPath?: string,
  interactive: boolean = false,
): Promise<PreviewResult> {
  const quiet = opts.quiet ?? false;
  const isJson = opts.json ?? false;

  validateSnippetName(name);

  const config = loadMirConfig(configPath ? { configPath } : { cwd });
  const registries = resolveInstallRegistries(config, opts.registry);

  const fetchOptions: FetchOptions = opts.timeout
    ? { timeoutMs: opts.timeout * 1000 }
    : {};

  type ResolvedSource =
    | { type: "local"; registryPath: string }
    | { type: "remote"; files: Map<string, string> };

  let source: ResolvedSource | undefined;
  let definition: SnippetDefinition | undefined;

  for (const entry of registries) {
    if (entry.url) {
      try {
        const remote = await fetchRemoteSnippet(entry.url, name, fetchOptions);
        definition = remote.definition;
        source = { type: "remote", files: remote.files };
        break;
      } catch {
        if (!quiet) {
          logger.warn(`Registry "${entry.name ?? entry.url}" から取得失敗。次の registry を試行します。`);
        }
        continue;
      }
    } else if (entry.path) {
      const regPath = resolveRegistryPath(entry);
      if (snippetExistsInRegistry(regPath, name)) {
        definition = readSnippetFromRegistry(regPath, name);
        source = { type: "local", registryPath: regPath };
        break;
      }
    }
  }

  if (!source || !definition) {
    throw new SnippetNotFoundError(name);
  }

  const variableDefs = definition.variables ?? {};
  const builtinVars = getBuiltinVariables(cwd);

  // 変数を解決
  const variables = await resolvePreviewVariables(
    variableDefs,
    variableArgs,
    interactive,
  );

  // builtin 変数をマージ (ユーザ指定が優先)
  for (const [key, value] of Object.entries(builtinVars)) {
    if (!(key in variables)) {
      variables[key] = value;
    }
  }

  // テンプレートを展開
  const expandedFiles =
    source.type === "local"
      ? expandTemplateDirectory(source.registryPath, name, variables)
      : expandRemoteTemplateFiles(source.files, variables);

  const files = [...expandedFiles.keys()];

  // ログ出力 (quiet/json モードでは抑制)
  if (!quiet && !isJson) {
    logger.info(t("preview.title", { name }));
    if (Object.keys(variableDefs).length > 0) {
      logger.step("Variables:");
      for (const key of Object.keys(variableDefs)) {
        const value = String(variables[key]);
        logger.label(key, value);
      }
    }
    logger.step("Files:");
    for (const filePath of files) {
      logger.fileItem(filePath);
    }
  }

  // --output オプションで拡張内容を含める
  const expandedContent = opts.output
    ? Object.fromEntries(expandedFiles)
    : undefined;

  if (isJson) {
    return {
      success: true,
      snippet: name,
      variables,
      files,
      expandedContent,
    };
  }

  return {
    success: true,
    snippet: name,
    variables,
    files,
    expandedContent,
  };
}

/**
 * プレビュー用の変数解決
 */
async function resolvePreviewVariables(
  variableDefs: Record<string, any>,
  args: Record<string, string>,
  interactive: boolean = false,
): Promise<Record<string, unknown>> {
  const variables: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(variableDefs)) {
    if (key in args) {
      variables[key] = coerceValue(args[key], def.schema?.type);
    } else if (def.schema?.default !== undefined) {
      variables[key] = def.schema.default;
    } else if (interactive) {
      // 対話モード: プロンプト表示
      const description = def.description ?? def.name ?? key;
      let answer = "";
      while (!answer) {
        answer = await prompt(`${description} (${key}): `);
        if (!answer) {
          logger.warn(t("error.variable-empty", { key }));
        }
      }
      variables[key] = coerceValue(answer, def.schema?.type);
    } else {
      // 非対話・デフォルトなし: エラー
      throw new MirError(
        t("error.variable-required", {
          key,
          hint: `--${key}=<value>`,
        }),
      );
    }
  }

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

export function registerPreviewCommand(program: Command): void {
  program
    .command("preview <name>")
    .description("スニペットのプレビューを表示する")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .option("--output", "生成されるファイルの内容を表示する")
    .option("--json", "結果を JSON 形式で出力する")
    .option("--quiet", "進捗ログを抑制する")
    .option("--timeout <seconds>", "リモート registry へのタイムアウト秒数", parseInt)
    .allowUnknownOption(true)
    .action(async (name: string, opts: PreviewOptions, cmd) => {
      const rawArgs: string[] = cmd.args.slice(0);
      const variableArgs = parseVariableArgs(rawArgs);

      try {
        const result = await previewSnippet(name, opts, variableArgs);
        if (opts.json) {
          process.stdout.write(JSON.stringify(result) + "\n");
        }
      } catch (err) {
        const errorResult: PreviewResult = {
          success: false,
          snippet: name,
          error: err instanceof Error ? err.message : String(err),
        };
        if (opts.json) {
          process.stdout.write(JSON.stringify(errorResult) + "\n");
        } else {
          logger.error(err instanceof Error ? err.message : String(err));
        }
        process.exit(1);
      }
    })
    .addHelpText("after", `
Examples:
  mir preview react-hook
  mir preview react-hook --name="MyHook"
  mir preview my-component --name="Button" --output
  mir preview template --json
  mir preview snippet --registry custom --dry-run`);
}

/** --key=value 形式の引数をパース */
function parseVariableArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}
