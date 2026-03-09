---
name: update-snippet
description: 既存の mir snippet を品質チェックリストに基づいて最新化・改善する。「snippet を改善したい」「最新化したい」「品質を上げたい」「snippet をメンテナンスしたい」と言った場合に使用する。
---

# update-snippet

既存の snippet を品質チェックリストに基づいて最新化・改善する skill。

## トリガー

ユーザが「snippet を改善したい」「最新化したい」「品質を上げたい」と言った場合に使用する。

## 手順

1. 対象の snippet を確認する
   ```bash
   npx mir info <name>
   ```
2. `mir sync` で変数定義を最新化する
   ```bash
   npx mir sync <name>
   ```
3. 以下のチェックリストを順に確認し、問題があれば修正する

### チェックリスト

- [ ] variable に適切な schema (type, default, enum), description, suggests が設定されている
- [ ] snippet.yaml に description, tags, version が適切に設定されている
- [ ] snippet 定義 YAML に保守用コメントが記述されている（参考にしたファイルパス、設計意図・経緯など）
- [ ] 生成されるコードがそのまま動く
  - 一時ディレクトリにインストールして動作を確認する
    ```bash
    npx mir install <name> --out-dir=/tmp/mir-test-<name>
    ```
  - 動作確認方法（ビルド、テスト等）はユーザに聞く
- [ ] dependencies が明示されている（他の snippet に依存する場合）
- [ ] 単体でもエラーにならないよう設計されている
- [ ] 未使用の変数定義がない
- [ ] テンプレートヘルパー（camelCase, pascalCase, kebabCase 等）を適切に活用し、1つの変数から複数の命名規則に展開している
- [ ] ファイル名にもテンプレート変数を使い、生成先が動的に制御できている
- [ ] hooks の before-install で前提条件の確認・説明を表示している
- [ ] hooks の after-install で次のステップ（例: `npm install` してください）を案内している
- [ ] テンプレートファイル内にパストラバーサル（`..`）が含まれていない
- [ ] snippet.yaml の `name` フィールドとファイル名が一致している

4. 修正を行ったら再度 `mir sync` して変数を同期する
5. 再度インストールテストを行い、問題がないことを確認する

## 注意事項

- 修正前に現在の状態をユーザに報告し、承認を得てから変更する
- hooks は snippet の用途に応じて必要な場合のみ設定する（全 snippet に必須ではない）
