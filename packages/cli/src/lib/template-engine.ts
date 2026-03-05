import Handlebars from "handlebars";
import path from "node:path";
import {
  listTemplateFiles,
  readTemplateFile,
} from "./registry.js";

export function expandTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(variables);
}

export function expandPath(
  pathTemplate: string,
  variables: Record<string, unknown>,
): string {
  const expanded = expandTemplate(pathTemplate, variables);
  // 展開後のパスを正規化（空セグメント除去、区切り文字統一）
  return path.normalize(expanded);
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
