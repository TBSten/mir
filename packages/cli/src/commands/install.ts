import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import {
  validateSnippetName,
  snippetExistsInRegistry,
  readSnippetFromRegistry,
  listRegistrySnippets,
  expandTemplateDirectory,
  expandRemoteTemplateFiles,
  fetchRemoteSnippet,
  listRemoteSnippets,
  executeHooks,
  MirError,
  SnippetNotFoundError,
  PathTraversalError,
  FileConflictError,
  findSymlinksInDirectory,
  t,
  type AuthorizationStatus,
  type SnippetDefinition,
  type VariableDefinition,
  type FetchOptions,
} from "@tbsten/mir-core";
import {
  loadMirConfig,
  resolveInstallRegistries,
  resolveRegistryPath,
} from "../lib/mirconfig.js";
import { prompt, selectWithSuggests, confirmOverwrite } from "../lib/prompt.js";
import { selectSnippet } from "../lib/snippet-list.js";
import { isCIEnvironment } from "../lib/ci-detector.js";
import * as logger from "../lib/logger.js";
import { printBatchSummary, type BatchSummaryItem } from "../lib/batch-summary.js";
import {
  getFailedSnippetNames,
  clearInstallFailures,
} from "../lib/install-failures.js";

export interface InstallOptions {
  registry?: string;
  outDir?: string;
  interactive?: boolean;
  dryRun?: boolean;
  /** safe モード: hooks・上書き・対話を無効化する */
  safe?: boolean;
  /** 結果を JSON 形式で出力する */
  json?: boolean;
  /** 進捗ログを抑制する（エラーのみ出力） */
  quiet?: boolean;
  /** リモート registry へのタイムアウト秒数 */
  timeout?: number;
  /** バッチインストール時、エラーが発生しても続行する */
  skipErrors?: boolean;
  /** 前回失敗したスニペットをもう一度インストール */
  retryFailed?: boolean;
}

/** install コマンドの実行結果 */
export interface InstallResult {
  success: boolean;
  snippet: string;
  variables?: Record<string, unknown>;
  files?: string[];
  outDir?: string;
  error?: string;
  code?: string;
}

export function getBuiltinVariables(cwd: string): Record<string, unknown> {
  const packageJsonPath = path.join(cwd, "package.json");
  let projectName = path.basename(cwd);
  try {
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (pkg.name) {
        projectName = pkg.name;
      }
    }
  } catch {
    // package.json の読み込みに失敗した場合はディレクトリ名をそのまま使う
  }
  return { "project-name": projectName };
}

export function validateOutputPath(filePath: string, outDir: string): void {
  const resolved = path.resolve(outDir, filePath);
  const normalizedOutDir = path.resolve(outDir);
  if (!resolved.startsWith(normalizedOutDir + path.sep) && resolved !== normalizedOutDir) {
    throw new PathTraversalError(filePath);
  }
}

/**
 * レジストリ内のシンボリックリンクをチェックする
 * safe モードではエラー、それ以外では警告を表示する
 */
function checkSymlinksInRegistry(
  registryPath: string,
  snippetName: string,
  safe: boolean,
  quiet: boolean,
): void {
  const snippetDir = path.join(registryPath, snippetName);
  if (!fs.existsSync(snippetDir)) return;

  const { hasSymlinks, symlinkPaths } = findSymlinksInDirectory(snippetDir);
  if (!hasSymlinks) return;

  const pathList = symlinkPaths.join(", ");
  if (safe) {
    throw new MirError(t("error.symlink-in-snippet", { paths: pathList }));
  } else if (!quiet) {
    for (const symlinkPath of symlinkPaths) {
      logger.warn(t("install.symlink-warning", { path: symlinkPath }));
    }
  }
}

export async function installSnippet(
  name: string,
  variableArgs: Record<string, string>,
  opts: InstallOptions = {},
  cwd: string = process.cwd(),
  configPath?: string,
): Promise<InstallResult> {
  // CI 環境では safe モードを自動適用
  const safe = opts.safe ?? isCIEnvironment();
  const quiet = opts.quiet ?? false;
  const isJson = opts.json ?? false;

  validateSnippetName(name);

  const config = loadMirConfig(configPath ? { configPath } : { cwd });

  // config.defaults をマージ (variableArgs が優先)
  if (config.defaults) {
    const mergedArgs = { ...config.defaults, ...variableArgs };
    Object.assign(variableArgs, mergedArgs);
  }

  const registries = resolveInstallRegistries(config, opts.registry);

  const fetchOptions: FetchOptions = opts.timeout
    ? { timeoutMs: opts.timeout * 1000 }
    : {};

  type ResolvedSource =
    | { type: "local"; registryPath: string }
    | { type: "remote"; files: Map<string, string> };

  let source: ResolvedSource | undefined;
  let definition: SnippetDefinition | undefined;
  let authorizationStatus: AuthorizationStatus | undefined;

  for (const entry of registries) {
    if (entry.url) {
      try {
        const remote = await fetchRemoteSnippet(entry.url, name, fetchOptions);
        definition = remote.definition;
        authorizationStatus = remote.authorizationStatus;
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
        // ローカル registry のシンボリックリンクチェック
        checkSymlinksInRegistry(regPath, name, safe, quiet);
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

  // safe モードでは対話を無効化
  const interactive = opts.interactive !== false && !safe;
  const variables = await resolveVariables(variableDefs, variableArgs, interactive);

  // builtin 変数をマージ (ユーザ指定が優先)
  for (const [key, value] of Object.entries(builtinVars)) {
    if (!(key in variables)) {
      variables[key] = value;
    }
  }

  // 変数一覧を表示（quiet/json モードでは抑制）
  if (!quiet && !isJson) {
    logVariableSummary(name, variableDefs, variables, variableArgs);
  }

  // 認可ステータスが approved でない場合は警告を表示
  if (authorizationStatus && authorizationStatus !== "approved") {
    const statusLabel = authorizationStatus === "examination" ? "審査中" : "却下済み";
    if (!quiet && !isJson) {
      logger.warn(`このスニペットは現在「${statusLabel}」です。公式に承認されていません。`);
    }
    if (interactive) {
      const answer = await prompt(`それでもインストールしますか？ (y/N): `);
      if (!answer || !["y", "yes"].includes(answer.toLowerCase())) {
        logger.info("インストールをキャンセルしました。");
        return {
          success: false,
          snippet: name,
          error: "User cancelled due to authorization status",
          code: "AuthorizationCancelled",
        };
      }
    }
  }

  // before-install hooks 実行 (safe モードではスキップ)
  if (definition.hooks?.["before-install"]?.length) {
    if (safe) {
      if (!quiet) {
        logger.warn(t("install.safe-mode-hooks-skipped"));
      }
    } else {
      const updatedVars = executeHooks(
        definition.hooks["before-install"],
        variables,
        { onEcho: quiet ? () => {} : logger.info },
      );
      Object.assign(variables, updatedVars);
    }
  }

  const expandedFiles =
    source.type === "local"
      ? expandTemplateDirectory(source.registryPath, name, variables)
      : expandRemoteTemplateFiles(source.files, variables);

  const outDir = opts.outDir
    ? path.resolve(cwd, opts.outDir)
    : cwd;

  // --dry-run: ファイル一覧表示のみ
  if (opts.dryRun) {
    if (!quiet) {
      logger.info(t("install.dry-run-files"));
      for (const filePath of expandedFiles.keys()) {
        const displayPath = opts.outDir
          ? path.join(opts.outDir, filePath)
          : filePath;
        logger.fileItem(displayPath);
      }
      logger.info(t("install.dry-run-complete"));
    }
    return {
      success: true,
      snippet: name,
      variables,
      files: [...expandedFiles.keys()].map((p) =>
        opts.outDir ? path.join(opts.outDir, p) : p,
      ),
      outDir,
    };
  }

  let overwriteAll = false;
  const createdFiles: string[] = [];

  for (const [filePath, content] of expandedFiles) {
    validateOutputPath(filePath, outDir);

    const fullPath = path.join(outDir, filePath);
    const displayPath = opts.outDir ? path.join(opts.outDir, filePath) : filePath;

    if (fs.existsSync(fullPath)) {
      if (overwriteAll) {
        // "all" が選択済みならそのまま上書き
      } else if (safe) {
        // safe モードでは上書きをスキップ（警告のみ）
        if (!quiet) {
          logger.warn(t("install.skip", { path: displayPath }));
        }
        continue;
      } else if (interactive) {
        const choice = await confirmOverwrite(filePath);
        if (choice === "no") {
          if (!quiet) {
            logger.warn(t("install.skip", { path: displayPath }));
          }
          continue;
        }
        if (choice === "all") {
          overwriteAll = true;
        }
      } else {
        throw new FileConflictError(filePath);
      }
    }

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
    createdFiles.push(displayPath);
  }

  // after-install hooks 実行 (safe モードではスキップ)
  if (definition.hooks?.["after-install"]?.length) {
    if (!safe) {
      executeHooks(definition.hooks["after-install"], variables, {
        onEcho: quiet ? () => {} : logger.info,
      });
    }
  }

  if (!quiet && !isJson) {
    logger.success(t("install.success", { name }));
    for (const filePath of createdFiles) {
      logger.fileItem(filePath);
    }
  }

  return {
    success: true,
    snippet: name,
    variables,
    files: createdFiles,
    outDir,
  };
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
    const suffix = isDefault ? ` ${t("general.default")}` : "";
    logger.label(key, `${value}${suffix}`);
  }
}

async function resolveVariables(
  variableDefs: Record<string, VariableDefinition>,
  args: Record<string, string>,
  interactive: boolean = true,
): Promise<Record<string, unknown>> {
  const variables: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(variableDefs)) {
    if (key in args) {
      variables[key] = coerceValue(args[key], def.schema?.type);
    } else if (def.suggests?.length) {
      if (!interactive) {
        // 非対話モード: default がない場合はエラー
        if (def.schema?.default === undefined) {
          throw new MirError(
            t("error.variable-required", {
              key,
              hint: `--${key}=<value>`,
            }),
          );
        }
        variables[key] = def.schema.default;
      } else {
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
      }
    } else if (def.schema?.default !== undefined) {
      variables[key] = def.schema.default;
    } else {
      if (!interactive) {
        // 非対話モード: default がない場合はエラー
        throw new MirError(
          t("error.variable-required", {
            key,
            hint: `--${key}=<value>`,
          }),
        );
      }
      // 対話モード: リトライループで空入力を許さない
      const description = def.description ?? def.name ?? key;
      let answer = "";
      while (!answer) {
        answer = await prompt(`${description} (${key}): `);
        if (!answer) {
          logger.warn(t("error.variable-empty", { key }));
        }
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

/** 複数 snippet 名をフィルタリングする（--key=value 形式を除外） */
export function parseSnippetNames(args: string[]): string[] {
  return args.filter((arg) => !arg.startsWith("--") && arg.trim() !== "");
}

/** ファイルからスニペット名を読み込む（改行またはカンマ区切り） */
export function parseSnippetNamesFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const names = content
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
  return names;
}

/** 単一スニペットのインストールを実行し、json/quiet に応じて出力を制御する */
export async function runInstallWithOutput(
  name: string,
  variableArgs: Record<string, string>,
  opts: InstallOptions,
  cwd?: string,
  configPath?: string,
): Promise<void> {
  const isJson = opts.json ?? false;

  if (isJson) {
    try {
      const result = await installSnippet(name, variableArgs, opts, cwd, configPath);
      process.stdout.write(JSON.stringify(result) + "\n");
    } catch (err) {
      const errorResult: InstallResult = {
        success: false,
        snippet: name,
        error: err instanceof Error ? err.message : String(err),
        code: err instanceof MirError ? err.constructor.name : "UnknownError",
      };
      process.stdout.write(JSON.stringify(errorResult) + "\n");
      process.exit(1);
    }
  } else {
    await installSnippet(name, variableArgs, opts, cwd, configPath);
  }
}

/** 複数スニペットのバッチインストール */
export async function runBatchInstall(
  snippetNames: string[],
  variableArgs: Record<string, string>,
  opts: InstallOptions,
  cwd?: string,
  configPath?: string,
): Promise<void> {
  const isJson = opts.json ?? false;
  const quiet = opts.quiet ?? false;
  const skipErrors = opts.skipErrors ?? false;
  const total = snippetNames.length;
  const results: InstallResult[] = [];
  let aborted = false;

  if (!quiet && !isJson) {
    logger.info(t("install.multiple-snippets"));
  }

  for (let i = 0; i < snippetNames.length; i++) {
    const name = snippetNames[i];
    const current = i + 1;

    if (!quiet && !isJson) {
      logger.step(t("install.snippet-n-of-m", { current, total, name }));
    }

    try {
      if (aborted) {
        // 前の処理で中止されているので、スキップ結果を記録
        results.push({
          success: false,
          snippet: name,
          error: "Skipped due to previous error",
          code: "SkippedError",
        });
      } else {
        const result = await installSnippet(name, variableArgs, opts, cwd, configPath);
        results.push(result);
      }
    } catch (err) {
      const errorResult: InstallResult = {
        success: false,
        snippet: name,
        error: err instanceof Error ? err.message : String(err),
        code: err instanceof MirError ? err.constructor.name : "UnknownError",
      };
      results.push(errorResult);

      if (!quiet && !isJson) {
        logger.error(err instanceof Error ? err.message : String(err));
      }

      // skipErrors が false の場合はここで中断
      if (!skipErrors) {
        aborted = true;
      }
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const skippedCount = results.filter(
    (r) => r.code === "SkippedError",
  ).length;

  if (isJson) {
    process.stdout.write(
      JSON.stringify({
        success: failCount === 0,
        total,
        successCount,
        failCount,
        skippedCount,
        results,
      }) + "\n",
    );
    if (failCount > 0) {
      process.exit(1);
    }
  } else if (!quiet) {
    // Batch summary を表示
    const summaryItems: BatchSummaryItem[] = results.map((r) => ({
      name: r.snippet,
      status: r.success
        ? "success"
        : r.code === "SkippedError"
          ? "skipped"
          : "failure",
      error: r.error,
    }));
    printBatchSummary(summaryItems);

    if (failCount > 0) {
      process.exit(1);
    }
  }
}

export function registerInstallCommand(program: Command): void {
  program
    .command("install [names...]")
    .alias("i")
    .description("snippet を registry からインストールする")
    .option("-r, --registry <name>", "検索対象 registry の名前")
    .option("-o, --out-dir <path>", "出力先ディレクトリ")
    .option("--no-interactive", "対話的な確認を無効化する")
    .option("--dry-run", "インストール前に生成されるファイル一覧を表示")
    .option("--safe", "safe モード: hooks・上書き・対話を無効化する")
    .option("--json", "結果を JSON 形式で出力する")
    .option("--quiet", "進捗ログを抑制する（エラーのみ出力）")
    .option("--skip-errors", "バッチインストール時、エラーが発生しても続行する")
    .option("--file <path>", "スニペット名を列挙したファイルを読み込む")
    .option("--timeout <seconds>", "リモート registry へのタイムアウト秒数", parseInt)
    .option("--retry-failed", "前回失敗したスニペットをもう一度インストール")
    .allowUnknownOption(true)
    .addHelpText("after", `
Examples:
  mir install react-hook
  mir install react-hook react-form
  mir install react-hook --out-dir ./src
  mir install react-hook --dry-run
  mir install react-hook --file snippets.txt
  mir install react-hook --registry custom --no-interactive
  mir install react-hook --framework=react --version=3.0`)
    .action(async (names: string[], opts: InstallOptions & { file?: string; retryFailed?: boolean }, cmd) => {
      const rawArgs: string[] = cmd.args.slice(0);

      // --no-interactive フラグを process.argv から直接チェック
      if (process.argv.includes("--no-interactive")) {
        opts.interactive = false;
      }

      const variableArgs = parseVariableArgs(rawArgs);
      let snippetNames = parseSnippetNames(names);

      // --retry-failed の場合は前回失敗したスニペットを読み込む
      if (opts.retryFailed) {
        const failedNames = getFailedSnippetNames();
        if (failedNames.length === 0) {
          logger.info(t("error.no-failed-snippets"));
          process.exit(0);
        }
        snippetNames = failedNames;
        // 成功時に履歴をクリアするために記録しておく
        logger.info(`Retrying ${failedNames.length} failed snippet(s)...`);
      }

      // --file オプションで指定されたファイルからスニペット名を読み込む
      if (opts.file) {
        try {
          const fileNames = parseSnippetNamesFromFile(opts.file);
          // CLI 引数で指定されたスニペット名と --file から読み込んだ名前をマージ
          snippetNames = [...snippetNames, ...fileNames];
        } catch (err) {
          if (err instanceof Error && "code" in err && err.code === "ENOENT") {
            logger.error(t("error.file-not-found", { path: opts.file }));
          } else {
            logger.error(t("error.file-read-failed", { path: opts.file }));
          }
          process.exit(1);
        }
      }

      // スニペット名が指定されていない場合は interactive に選択
      if (snippetNames.length === 0) {
        const config = loadMirConfig({ cwd: process.cwd() });
        const registries = resolveInstallRegistries(config, opts.registry);
        const allSnippets: string[] = [];

        const fetchOptions: FetchOptions = opts.timeout
          ? { timeoutMs: opts.timeout * 1000 }
          : {};

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
        const selected = await selectSnippet(allSnippets);
        snippetNames.push(selected);
      }

      if (snippetNames.length === 1) {
        await runInstallWithOutput(snippetNames[0], variableArgs, opts);
        // 成功時は失敗履歴をクリア
        if (opts.retryFailed) {
          clearInstallFailures();
        }
      } else {
        await runBatchInstall(snippetNames, variableArgs, opts);
        // 成功時は失敗履歴をクリア
        if (opts.retryFailed) {
          clearInstallFailures();
        }
      }
    });
}
