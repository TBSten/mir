import { createHash } from "node:crypto";

/**
 * コンテンツの SHA-256 ハッシュを計算する
 * @param content ハッシュ計算対象の文字列
 * @returns "sha256:<hex>" 形式のハッシュ文字列
 */
export function computeHash(content: string): string {
  const hash = createHash("sha256");
  hash.update(content, "utf-8");
  return `sha256:${hash.digest("hex")}`;
}

/**
 * snippet のファイルマップ全体のハッシュを計算する
 * ファイルパスとコンテンツを結合してハッシュを取得する
 * @param files ファイルパス -> コンテンツのマップ
 * @returns "sha256:<hex>" 形式のハッシュ文字列
 */
export function computeSnippetHash(files: Map<string, string>): string {
  const hash = createHash("sha256");

  // 一貫性のためにファイルパスをソートして処理
  const sortedEntries = [...files.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [filePath, content] of sortedEntries) {
    hash.update(`path:${filePath}\n`, "utf-8");
    hash.update(`content:${content}\n`, "utf-8");
  }

  return `sha256:${hash.digest("hex")}`;
}

/**
 * ハッシュ文字列の形式を検証する
 * @param hash 検証対象のハッシュ文字列
 * @returns 有効な "sha256:<hex>" 形式であれば true
 */
export function isValidHashFormat(hash: string): boolean {
  return /^sha256:[0-9a-f]{64}$/.test(hash);
}

/**
 * 2つのハッシュが一致するか確認する
 * @param expected 期待するハッシュ
 * @param actual 実際のハッシュ
 * @returns 一致すれば true
 */
export function verifyHash(expected: string, actual: string): boolean {
  return expected === actual;
}
