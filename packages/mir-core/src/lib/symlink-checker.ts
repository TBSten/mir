import fs from "node:fs";
import path from "node:path";

export interface SymlinkCheckResult {
  hasSymlinks: boolean;
  symlinkPaths: string[];
}

/**
 * 指定ファイルがシンボリックリンクかどうかを確認する
 * lstat を使用することで、リンク先ではなくリンク自体の情報を取得する
 */
export function isSymbolicLink(filePath: string): boolean {
  try {
    const stat = fs.lstatSync(filePath);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * ディレクトリ内のシンボリックリンクを再帰的に検索する
 * @param dirPath 検索対象ディレクトリ
 * @returns シンボリックリンクの有無と、見つかったシンボリックリンクのパス一覧
 */
export function findSymlinksInDirectory(dirPath: string): SymlinkCheckResult {
  const symlinkPaths: string[] = [];

  function walkDir(currentPath: string, relativePath: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = relativePath
        ? path.join(relativePath, entry.name)
        : entry.name;

      // isSymbolicLink() は entry レベルで確認可能だが、
      // lstat で確実に判定するため個別確認
      if (isSymbolicLink(fullPath)) {
        symlinkPaths.push(relPath);
      } else if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    walkDir(dirPath, "");
  }

  return {
    hasSymlinks: symlinkPaths.length > 0,
    symlinkPaths,
  };
}
