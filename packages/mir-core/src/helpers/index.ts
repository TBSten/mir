import type Handlebars from "handlebars";
import * as helpers from "./string-helpers.js";

/** ヘルパー名一覧（extractVariables でフィルタ用） */
export const HELPER_NAMES: ReadonlySet<string> = new Set([
  "lowercase",
  "uppercase",
  "capitalize",
  "uncapitalize",
  "replace",
  "camelCase",
  "pascalCase",
  "snakeCase",
  "kebabCase",
  "trim",
]);

/** Handlebars インスタンスにヘルパーを一括登録 */
export function registerHelpers(hbs: typeof Handlebars): void {
  hbs.registerHelper("lowercase", (v: unknown) => helpers.lowercase(v));
  hbs.registerHelper("uppercase", (v: unknown) => helpers.uppercase(v));
  hbs.registerHelper("capitalize", (v: unknown) => helpers.capitalize(v));
  hbs.registerHelper("uncapitalize", (v: unknown) => helpers.uncapitalize(v));
  hbs.registerHelper(
    "replace",
    (v: unknown, search: unknown, replacement: unknown) =>
      helpers.replace(v, search, replacement),
  );
  hbs.registerHelper("camelCase", (v: unknown) => helpers.camelCase(v));
  hbs.registerHelper("pascalCase", (v: unknown) => helpers.pascalCase(v));
  hbs.registerHelper("snakeCase", (v: unknown) => helpers.snakeCase(v));
  hbs.registerHelper("kebabCase", (v: unknown) => helpers.kebabCase(v));
  hbs.registerHelper("trim", (v: unknown) => helpers.trim(v));
}
