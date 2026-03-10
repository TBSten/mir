/**
 * Handlebars カスタムヘルパー用の純粋関数群
 * 外部ライブラリ不使用
 */

/** 単語分割: `-`, `_`, `.`, `/`, スペース, camelCase 境界で分割 */
function splitWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1\0$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2")
    .split(/[-_./\s\0]+/)
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

/** 文字列に指定した部分文字列が含まれるか（GitHub Actions: contains） */
export function contains(value: unknown, search: unknown): boolean {
  return String(value).includes(String(search));
}

/** 文字列が指定した部分文字列で始まるか（GitHub Actions: startsWith） */
export function startsWith(value: unknown, search: unknown): boolean {
  return String(value).startsWith(String(search));
}

/** 文字列が指定した部分文字列で終わるか（GitHub Actions: endsWith） */
export function endsWith(value: unknown, search: unknown): boolean {
  return String(value).endsWith(String(search));
}

/** ドット区切り（Java パッケージ名等: com.example.app） */
export function dotCase(value: unknown): string {
  return splitWords(String(value))
    .map((w) => w.toLowerCase())
    .join(".");
}

/** パス区切り（ディレクトリパス: com/example/app） */
export function pathCase(value: unknown): string {
  return splitWords(String(value))
    .map((w) => w.toLowerCase())
    .join("/");
}

/** 文字列結合 */
export function concat(...values: unknown[]): string {
  // Handlebars が最後の引数に options オブジェクトを渡すので除外
  const args = values.filter(
    (v) => typeof v !== "object" || v === null,
  );
  return args.map(String).join("");
}

/** 部分文字列の切り出し */
export function slice(
  value: unknown,
  start: unknown,
  end?: unknown,
): string {
  const s = String(value);
  const startIdx = Number(start);
  if (end !== undefined && typeof end !== "object") {
    return s.slice(startIdx, Number(end));
  }
  return s.slice(startIdx);
}

/** 文字列の長さを返す */
export function length(value: unknown): number {
  return String(value).length;
}
