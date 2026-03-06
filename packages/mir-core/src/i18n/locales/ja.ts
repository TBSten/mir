import type { MessageCatalog } from "../types.js";

export const ja: MessageCatalog = {
  // errors
  "error.snippet-not-found": "Snippet \"{name}\" が見つかりません。`mir list` で利用可能な snippet を確認するか、`--registry` で別の registry を指定してください",
  "error.snippet-already-exists": "Snippet \"{name}\" は既に存在します。`--force` で上書きするか、別の名前を指定してください",
  "error.registry-not-found": "Registry \"{name}\" が見つかりません。`~/.mir/mirconfig.yaml` で registry を設定してください",
  "error.registry-remote": "リモート registry には publish できません",
  "error.registry-remote-named": "Registry \"{name}\" はリモート registry のため publish できません",
  "error.path-traversal": "セキュリティエラー: ファイルパス \"{path}\" が出力範囲外を参照しています。テンプレートファイルを確認してください",
  "error.file-conflict": "ファイル \"{path}\" は既に存在します。`--no-interactive` で全て上書きするか、`--out-dir` で別ディレクトリを指定してください",
  "error.validation": "バリデーションエラー",
  "error.invalid-snippet-name": "不正な snippet 名 \"{name}\" です。英数字とハイフンのみ使用可能で、先頭は英数字にしてください",
  "error.variable-empty": "変数 \"{key}\" の値が入力されませんでした",
  "error.variable-required": "変数 \"{key}\" の値が必要です。{hint} で指定してください",
  "error.exit-hook": "install が中止されました",
  "error.hook-input-required": "変数 \"{key}\" の入力が必要ですが、interactive mode は未対応です。default 値を指定してください",
  "error.no-snippets": "選択可能な snippet がありません",
  "error.remote-fetch": "リモート registry の取得に失敗しました: {url}",
  "error.remote-fetch-status": "リモート registry の取得に失敗しました: {url} (HTTP {status})",
  "error.invalid-manifest": "リモート registry のマニフェストが不正です: {url}",
  "error.fetch-timeout": "タイムアウト: {url} への接続が {timeout} 秒以内に完了しませんでした",
  "error.symlink-detected": "シンボリックリンクが検出されました: {path}",
  "error.symlink-in-snippet": "Snippet にシンボリックリンクが含まれています: {paths}",
  "error.safe-mode-overwrite": "safe モードでは既存ファイルの上書きは許可されていません: {path}",
  "error.file-not-found": "ファイル \"{path}\" が見つかりません",
  "error.file-read-failed": "ファイル \"{path}\" の読み込みに失敗しました",

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
  "install.dry-run-files": "[dry-run] 生成されるファイル:",
  "install.dry-run-complete": "[dry-run] 実際のファイル書き込みは実行されていません。",
  "install.multiple-snippets": "複数の snippet をインストール中...",
  "install.snippet-n-of-m": "{current} / {total}: {name}",
  "install.completed-multiple": "{count} 個の snippet をインストールしました",
  "install.failed-multiple": "{count} 個の snippet のインストールに失敗しました",
  "install.safe-mode-hooks-skipped": "[safe] hooks の実行をスキップしました",
  "install.symlink-warning": "シンボリックリンクが検出されました: {path}",

  // sync
  "sync.no-new-vars": "追加する変数はありません",
  "sync.success": "{count} 件の変数を追加しました",

  // search
  "search.query-required": "検索キーワードが必要です",
  "search.no-results": "\"{query}\" に一致する snippet が見つかりません",

  // clone
  "clone.success": "Snippet \"{name}\" を \"{alias}\" として複製しました",

  // preview
  "preview.title": "プレビュー: {name}",
  "preview.confirm": "この snippet をインストールしますか？",

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
