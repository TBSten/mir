import Handlebars from "handlebars";
import fs from "node:fs";
import path from "node:path";
import {
  listTemplateFiles,
  readTemplateFile,
} from "./registry.js";
import { HELPER_NAMES, registerHelpers } from "./helpers/index.js";

// 隔離インスタンスを作成しヘルパーを登録
const hbs = Handlebars.create();
registerHelpers(hbs);

export function expandTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  const compiled = hbs.compile(template, { noEscape: true });
  return compiled(variables);
}

/**
 * default 値が Handlebars テンプレートを含む場合に展開する。
 * テンプレート構文 ({{ }}) を含まない場合はそのまま返す。
 */
export function expandDefaultValue(
  defaultValue: unknown,
  resolvedVariables: Record<string, unknown>,
): unknown {
  if (typeof defaultValue !== "string") return defaultValue;
  // Handlebars 構文を含まない場合はそのまま
  if (!defaultValue.includes("{{")) return defaultValue;
  return expandTemplate(defaultValue, resolvedVariables);
}

export function expandPath(
  pathTemplate: string,
  variables: Record<string, unknown>,
): string {
  const expanded = expandTemplate(pathTemplate, variables);
  // 展開後のパスを正規化（空セグメント除去、区切り文字統一）
  return path.normalize(expanded);
}

/** Handlebars 組み込みヘルパー名 */
const BUILTIN_HELPERS = new Set([
  "if",
  "unless",
  "each",
  "with",
  "lookup",
  "log",
]);

export function extractVariables(template: string): string[] {
  const ast = Handlebars.parse(template);
  const vars = new Set<string>();

  function collectVarFromExpression(expr: hbs.AST.Expression): void {
    if (expr.type === "PathExpression") {
      const pathExpr = expr as hbs.AST.PathExpression;
      vars.add(pathExpr.parts[0]);
    } else if (expr.type === "SubExpression") {
      // サブ式: {{lowercase (replace name "/" ".")}} 等
      const sub = expr as hbs.AST.SubExpression;
      // sub.path はヘルパー名なのでスキップ、params のみ抽出
      if (sub.params) {
        for (const param of sub.params) collectVarFromExpression(param);
      }
    }
  }

  function visit(node: hbs.AST.Node): void {
    if (node.type === "MustacheStatement") {
      const stmt = node as hbs.AST.MustacheStatement;
      if (stmt.params && stmt.params.length > 0) {
        // ヘルパー呼び出し: path はヘルパー名なのでスキップ、params のみ変数抽出
        for (const param of stmt.params) collectVarFromExpression(param);
      } else {
        // 単純な変数参照: {{name}}
        if (stmt.path) collectVarFromExpression(stmt.path);
      }
    }
    if (node.type === "BlockStatement") {
      const block = node as hbs.AST.BlockStatement;
      // #if, #unless, #each 等のパラメータから変数を抽出
      if (block.params) {
        for (const param of block.params) collectVarFromExpression(param);
      }
      if (block.program) visit(block.program);
      if (block.inverse) visit(block.inverse);
    }
    if ("body" in node && Array.isArray((node as hbs.AST.Program).body)) {
      for (const child of (node as hbs.AST.Program).body) {
        visit(child);
      }
    }
  }

  visit(ast);

  // ヘルパー名・組み込みヘルパー名を除外
  for (const name of HELPER_NAMES) vars.delete(name);
  for (const name of BUILTIN_HELPERS) vars.delete(name);

  return [...vars];
}

const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

export function extractVariablesFromDirectory(dirPath: string): string[] {
  const allVars = new Set<string>();

  function walkDir(currentPath: string): void {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_FILES.has(entry.name)) continue;
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        // ディレクトリ名からも変数を抽出
        for (const v of extractVariables(entry.name)) {
          allVars.add(v);
        }
        walkDir(fullPath);
      } else {
        // ファイル名から変数を抽出
        for (const v of extractVariables(entry.name)) {
          allVars.add(v);
        }
        // ファイル内容から変数を抽出
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const v of extractVariables(content)) {
          allVars.add(v);
        }
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    walkDir(dirPath);
  }
  return [...allVars];
}

export function expandTemplateDirectory(
  registryPath: string,
  snippetName: string,
  variables: Record<string, unknown>,
): Map<string, string> {
  const files = listTemplateFiles(registryPath, snippetName);
  const result = new Map<string, string>();

  for (const filePath of files) {
    const expandedPath = expandPath(filePath, variables);
    const content = readTemplateFile(registryPath, snippetName, filePath);
    const expandedContent = expandTemplate(content, variables);
    result.set(expandedPath, expandedContent);
  }

  return result;
}
