---
name: extract-snippet
description: 既存のプロジェクトコードから mir snippet を新規作成する。「このコードを snippet にしたい」「テンプレート化したい」「コードを再利用可能にしたい」など、プロジェクト内のコードを snippet として切り出したい場合に使用する。
---

# extract-snippet

既存のプロジェクトコードから snippet を新規作成する skill。

## トリガー

ユーザが「このコードを snippet にしたい」「テンプレート化したい」など、既存コードから snippet を切り出したい場合に使用する。

## 手順

1. ユーザに snippet として切り出したいコードの範囲を確認する
   - 対象ファイル・ディレクトリ
   - snippet の名前
   - snippet の用途・説明
2. 指定されたソースコードをプロジェクト全体から網羅的に探す
   - 関連ファイル（型定義、テスト、設定ファイル等）も含めて収集する
3. プロジェクト固有の情報を特定し、variable として切り出すか削除する
   - プロジェクト名、パッケージ名 → `{{ project-name }}` 等の変数に置換
   - 固有のパス、URL → 変数化
   - ハードコードされた設定値 → 変数化（default 値を元の値に設定）
4. `.mir/` の管理方針をユーザに確認する:
   - **チームで共有する**: `.mir/` を git に含める
   - **自分だけ使う**: `.mir/` を git に含めない（`private-mir` skill を案内）
5. `mir create <name>` で snippet の雛形を作成する
   ```bash
   npx mir create <name>
   ```
6. テンプレートファイルを `.mir/snippets/<name>/` に配置する
   - Handlebars テンプレート構文で変数部分を置換
   - ファイル名にも変数を使用（例: `{{ kebabCase name }}.ts`）
   - テンプレートヘルパーを活用（camelCase, pascalCase, kebabCase 等）
7. `.mir/snippets/<name>.yaml` に変数定義を記述する
   - 各変数に description, schema (type, default, enum), suggests を設定
8. `mir sync <name>` で変数定義を同期する
   ```bash
   npx mir sync <name>
   ```
9. 動作確認: 一時ディレクトリにインストールして展開結果を確認する
   ```bash
   npx mir install <name> --out-dir=/tmp/mir-test-<name>
   ```

## 注意事項

- プロジェクト固有の import パスやモジュール名は必ず変数化する
- テンプレートヘルパーを使い、命名規則の変換を自動化する
- 元のコードが動作する状態を保つ（生成されたコードがそのままビルド・実行できること）
- snippet 名は英数字とハイフンのみ (`^[a-zA-Z0-9][a-zA-Z0-9-]*$`)
