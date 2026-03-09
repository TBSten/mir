/**
 * ファイルパスの配列からツリー構造を構築するユーティリティ
 */

export interface FileTreeNode {
  /** ノード名（ディレクトリ名 or ファイル名） */
  name: string;
  /** ファイルの場合はフルパス */
  fullPath?: string;
  /** 子ノード（ディレクトリの場合） */
  children: FileTreeNode[];
}

/**
 * ファイルパスの配列からツリー構造を構築する。
 * 同一ディレクトリ内のファイルはまとめられる。
 * 子が1つだけのディレクトリは親と結合して表示を圧縮する。
 *
 * 例:
 *   ["a/b/c/x.kt", "a/b/c/y.kt"]
 *   → { name: "a/b/c", children: [{ name: "x.kt" }, { name: "y.kt" }] }
 */
export function buildFileTree(filePaths: string[]): FileTreeNode {
  const root: FileTreeNode = { name: "", children: [] };

  for (const fp of filePaths) {
    const parts = fp.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children.push({ name: part, fullPath: fp, children: [] });
      } else {
        let child = current.children.find(
          (c) => c.name === part && !c.fullPath,
        );
        if (!child) {
          child = { name: part, children: [] };
          current.children.push(child);
        }
        current = child;
      }
    }
  }

  // 子が1つだけのディレクトリノードを結合して圧縮する
  compressTree(root);

  return root;
}

function compressTree(node: FileTreeNode): void {
  for (const child of node.children) {
    compressTree(child);
  }

  // 自身がディレクトリ（fullPath なし）で子が1つだけのディレクトリの場合、結合
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child.fullPath && child.children.length === 1 && !child.children[0].fullPath) {
      // ディレクトリ同士を結合
      const grandchild = child.children[0];
      child.name = `${child.name}/${grandchild.name}`;
      child.children = grandchild.children;
      // 結合後もう一度同じインデックスを再チェック
      i--;
    }
  }
}
