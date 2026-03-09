---
name: mir-publish-snippet
description: mir snippet を registry に公開する。「snippet を公開して」「publish して」「registry に登録して」と言った場合に使用する。公開前の品質レビューと動作確認を含む。
---

# publish-snippet

snippet を registry に公開する skill。

## トリガー

ユーザが「snippet を公開して」「publish して」「registry に登録して」と言った場合に使用する。

## 手順

1. 対象の snippet を確認する
   ```bash
   npx mir info <name>
   ```
2. **公開先を必ずユーザに確認する。** 以下の選択肢を提示すること:
   - **ローカル registry** (`~/.mir/registry/`): 自分の PC 内にのみ保存される
   - **⚠️🌍 official-registry ⚠️🌍**: **全世界の誰でも閲覧・インストール可能になります！** 公開して問題ないか十分に確認してください
3. 公開前に snippet の品質をレビューする（`review-snippet` skill の観点でチェック）
   - snippet.yaml の定義を読んで問題がないか確認
   - テンプレートファイルを読んで問題がないか確認
   - 保守用コメント（参考ファイルパス、設計意図）が記述されているか確認
   - 問題があればユーザに報告し、修正を提案する
4. レビューで問題がなければ公開を実行する
   - ローカルの場合:
     ```bash
     npx mir publish <name>
     ```
   - official-registry の場合:
     ```bash
     npx mir publish <name> --registry=official
     ```
5. 同名 snippet が既に存在する場合はユーザに確認し、必要なら `--force` を付ける
   ```bash
   npx mir publish <name> --force
   ```
5. 公開成功後、動作確認を行う
   ```bash
   # registry に表示されることを確認
   npx mir list
   # 実際にインストールできることを確認
   npx mir install <name> --out-dir=/tmp/mir-publish-test-<name>
   ```
6. テスト用ディレクトリを削除する

## 注意事項

- リモート registry に公開する場合は `--registry=<name>` を指定する
- リモート registry には事前にログインが必要: `npx mir login [--registry=<name>]`
- 公開前のレビューは省略しない（品質の低い snippet の公開を防ぐ）
- 公開後は必ずインストールテストで動作を確認する
- snippet の所有権は最初に publish したユーザーに帰属する（owner のみ上書き可能）
