import fs from "node:fs";
import path from "node:path";
import { snippetsBasePath } from "./paths.js";
import { selectWithSuggests } from "./prompt.js";
import { t } from "./i18n/index.js";

export function listLocalSnippets(cwd: string): string[] {
  const basePath = snippetsBasePath(cwd);
  if (!fs.existsSync(basePath)) {
    return [];
  }
  const entries = fs.readdirSync(basePath);
  return entries
    .filter((e) => e.endsWith(".yaml"))
    .map((e) => e.replace(/\.yaml$/, ""));
}

export async function selectSnippet(snippets: string[]): Promise<string> {
  if (snippets.length === 0) {
    throw new Error(t("error.no-snippets"));
  }
  return selectWithSuggests({
    question: t("prompt.select-snippet"),
    suggests: snippets,
    allowManualInput: false,
  });
}
