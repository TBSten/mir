/**
 * Handlebars カスタムヘルパー用の純粋関数群
 * 外部ライブラリ不使用
 */

/** 単語分割: `-`, `_`, `.`, スペース, camelCase 境界で分割 */
function splitWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split(/[-_.\s\0]+/)
    .filter((w) => w.length > 0);
}

export function lowercase(value: unknown): string {
  return String(value).toLowerCase();
}

export function uppercase(value: unknown): string {
  return String(value).toUpperCase();
}

export function capitalize(value: unknown): string {
  const s = String(value);
  if (s.length === 0) return s;
  return s[0].toUpperCase() + s.slice(1);
}

export function uncapitalize(value: unknown): string {
  const s = String(value);
  if (s.length === 0) return s;
  return s[0].toLowerCase() + s.slice(1);
}

/** リテラル文字列置換（replaceAll）。正規表現は受け付けない（ReDoS 防止） */
export function replace(
  value: unknown,
  search: unknown,
  replacement: unknown,
): string {
  const s = String(value);
  const searchStr = String(search);
  const replaceStr = String(replacement);
  if (searchStr === "") return s;
  return s.split(searchStr).join(replaceStr);
}

export function camelCase(value: unknown): string {
  const words = splitWords(String(value));
  return words
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

export function pascalCase(value: unknown): string {
  const words = splitWords(String(value));
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
}

export function snakeCase(value: unknown): string {
  return splitWords(String(value))
    .map((w) => w.toLowerCase())
    .join("_");
}

export function kebabCase(value: unknown): string {
  return splitWords(String(value))
    .map((w) => w.toLowerCase())
    .join("-");
}

export function trim(value: unknown): string {
  return String(value).trim();
}
