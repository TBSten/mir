---
name: mir-error-handling
description: mir CLI でエラーが発生した際のトラブルシューティングを行う。SnippetNotFoundError, RegistryNotFoundError, FileConflictError 等のエラーメッセージが表示された場合や、ユーザが「エラーが出た」「動かない」「mir がうまくいかない」と言った場合に使用する。
---

# error-handling

mir CLI でエラーが発生した際のトラブルシューティングを行う skill。

## トリガー

ユーザが mir コマンドの実行中にエラーに遭遇した場合、またはエラーの原因を調べたい場合に使用する。

## エラー一覧と対処法

### SnippetNotFoundError

snippet が見つからない。

- `.mir/snippets/<name>.yaml` と `.mir/snippets/<name>/` ディレクトリの**両方**が存在するか確認
- 片方だけでは動作しない
- snippet 名のタイポがないか確認

### snippet 名が不正

- `^[a-zA-Z0-9][a-zA-Z0-9-]*$` に従っているか確認
- 英数字とハイフンのみ、英数字始まり

### RegistryNotFoundError

registry が見つからない。

- `mirconfig.yaml` の `registries` 設定を確認
- `--registry` で指定した名前が存在するか確認
- `mir list` で利用可能な registry を確認

### FileConflictError

install 先に同名ファイルが既にある。

- `--force` で上書きする
- または手動で既存ファイルを退避してから再実行

### PathTraversalError

テンプレートのファイル名に `..` が含まれている。

- テンプレートディレクトリ内のファイルパスに `..` が含まれていないか確認
- テンプレートのファイルパスを修正する

### 変数未指定（非対話モード）

`--no-interactive` 使用時に必須変数が指定されていない。

- CLI 引数で `--変数名=値` を指定する
- または snippet.yaml の変数定義に `default` を設定する

### リモート registry への publish 失敗

| HTTP ステータス | 原因 | 対処 |
|---|---|---|
| 401 | `publish_token` が無効 | トークンを再取得して `mirconfig.yaml` を更新 |
| 403 | 権限不足 | トークンの権限を確認 |
| 409 | 同名 snippet が存在 | `--force` で上書き公開 |

### YAML バリデーションエラー

- `snippet.yaml` が `schema/v1/snippet.schema.json` に準拠しているか確認
- 必須フィールド `name` が設定されているか確認
- `name` フィールドがファイル名と一致しているか確認

## 手順

1. エラーメッセージを確認する
2. 上記の一覧から該当するエラーを特定する
3. 対処法に従って修正する
4. 修正後、コマンドを再実行して動作を確認する

## 解決できない場合

- `mir --help` や `mir <command> --help` でコマンドの使い方を確認
- どうしても解決できなければ GitHub に issue を立てる: https://github.com/TBSten/mir/issues
