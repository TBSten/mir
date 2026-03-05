import type { MessageCatalog } from "../types.js";

export const ja: MessageCatalog = {
  // errors
  "error.snippet-not-found": "Snippet \"{name}\" が見つかりません",
  "error.snippet-already-exists": "Snippet \"{name}\" は既に存在します",
  "error.registry-not-found": "Registry \"{name}\" が見つかりません",
  "error.registry-remote": "リモート registry には publish できません",
  "error.registry-remote-named": "Registry \"{name}\" はリモート registry のため publish できません",
  "error.path-traversal": "パス \"{path}\" は出力ディレクトリの外を参照しています",
  "error.file-conflict": "ファイル \"{path}\" は既に存在します",
  "error.validation": "バリデーションエラー",
  "error.invalid-snippet-name": "不正な snippet 名 \"{name}\" です。英数字とハイフンのみ使用可能で、先頭は英数字にしてください",
  "error.variable-empty": "変数 \"{key}\" の値が入力されませんでした",
  "error.exit-hook": "install が中止されました",
  "error.hook-input-required": "変数 \"{key}\" の入力が必要ですが、interactive mode は未対応です。default 値を指定してください",
  "error.no-snippets": "選択可能な snippet がありません",

  // create
  "create.success": "Snippet \"{name}\" を作成しました",

  // publish
  "publish.success": "Snippet \"{name}\" を registry に登録しました",
  "publish.cancelled": "publish をキャンセルしました",
  "publish.confirm-overwrite": "Snippet \"{name}\" は既に存在します。上書きしますか？",

  // install
  "install.success": "Snippet \"{name}\" をインストールしました",
  "install.skip": "スキップ: {path}",
  "install.confirm-overwrite": "ファイル \"{path}\" は既に存在します。上書きしますか？ (y/n/a): ",

  // sync
  "sync.no-new-vars": "追加する変数はありません",
  "sync.success": "{count} 件の変数を追加しました",

  // prompt
  "prompt.snippet-name": "snippet 名: ",
  "prompt.select-snippet": "snippet を選択してください",
  "prompt.select": "選択: ",
  "prompt.enter-number": "番号を入力してください",
  "prompt.other-manual": "その他 (手動入力)",
  "prompt.use-default": "Enter で {value} を使用",
  "prompt.use-default-value": "Enter でデフォルト値 \"{value}\" を使用",
  "prompt.yes-no-all": "(y/n/a): ",
  "prompt.yes-no": "(y/N): ",

  // general
  "general.variables": "Variables:",
  "general.default": "(default)",
};
