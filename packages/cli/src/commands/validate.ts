import type { Command } from "commander";
import fs from "node:fs";
import {
  validateSnippetName,
  parseSnippetYaml,
  extractVariablesFromDirectory,
  SnippetNotFoundError,
  t,
  type SnippetDefinition,
} from "@tbsten/mir-core";
import { snippetYamlPath, snippetDirPath } from "../lib/paths.js";
import { listLocalSnippets, selectSnippet } from "../lib/snippet-list.js";
import * as logger from "../lib/logger.js";

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  definition?: SnippetDefinition;
}

export function validateSnippet(
  name: string,
  cwd: string = process.cwd(),
): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateSnippetName(name);

  const yamlPath = snippetYamlPath(cwd, name);
  if (!fs.existsSync(yamlPath)) {
    throw new SnippetNotFoundError(name);
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");

  // YAML パース & スキーマバリデーション
  let definition: SnippetDefinition;
  try {
    definition = parseSnippetYaml(yamlContent);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return { valid: false, errors, warnings };
  }

  // テンプレートディレクトリの存在チェック
  const dirPath = snippetDirPath(cwd, name);
  if (!fs.existsSync(dirPath)) {
    warnings.push(
      t("validate.no-template-dir", { path: dirPath }),
    );
  } else {
    // テンプレート変数と定義の変数の整合性チェック
    const templateVars = extractVariablesFromDirectory(dirPath);
    const definedVars = Object.keys(definition.variables ?? {});

    const undefinedVars = templateVars.filter(
      (v) => !definedVars.includes(v),
    );
    if (undefinedVars.length > 0) {
      warnings.push(
        t("validate.undefined-vars", { vars: undefinedVars.join(", ") }),
      );
    }

    const unusedVars = definedVars.filter(
      (v) => !templateVars.includes(v),
    );
    if (unusedVars.length > 0) {
      warnings.push(
        t("validate.unused-vars", { vars: unusedVars.join(", ") }),
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    definition,
  };
}

export function registerValidateCommand(program: Command): void {
  program
    .command("validate [name]")
    .alias("v")
    .description("snippet の設定ファイルを検証する")
    .addHelpText("after", `
Examples:
  mir validate react-hook
  mir validate
  mir v react-hook`)
    .action(async (name: string | undefined) => {
      let snippetName = name;
      if (!snippetName) {
        const snippets = listLocalSnippets(process.cwd());
        snippetName = await selectSnippet(snippets);
      }

      const result = validateSnippet(snippetName);

      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          logger.warn(w);
        }
      }

      if (result.valid) {
        logger.success(t("validate.success", { name: snippetName }));
      } else {
        for (const e of result.errors) {
          logger.error(e);
        }
        process.exit(1);
      }
    });
}
