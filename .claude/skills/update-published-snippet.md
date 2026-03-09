---
name: update-published-snippet
description: 公開済の mir snippet を更新・バージョンアップする。「公開済の snippet を更新したい」「publish した snippet を修正したい」「snippet のバージョンを上げたい」と言った場合に使用する。
---

# update-published-snippet

公開済の snippet を更新する skill。

## トリガー

ユーザが「公開済の snippet を更新したい」「publish した snippet を修正したい」「snippet のバージョンを上げたい」と言った場合に使用する。

## 手順

1. 対象の snippet の現在の状態を確認する
   ```bash
   npx mir info <name>
   ```
2. **更新先の registry を必ずユーザに確認する。** 以下の選択肢を提示すること:
   - **ローカル registry** (`~/.mir/registry/`): 自分の PC 内にのみ保存される
   - **⚠️🌍 official-registry ⚠️🌍**: **全世界の誰でも閲覧・インストール可能になります！** 更新して問題ないか十分に確認してください
3. snippet のテンプレートや変数定義を修正する（ユーザの要件に応じて）
3. `mir sync` で変数定義を最新化する
   ```bash
   npx mir sync <name>
   ```
4. snippet の品質をレビューする（`review-snippet` skill の観点でチェック）
5. snippet.yaml の `version` フィールドを更新する
   - 破壊的変更: メジャーバージョンを上げる
   - 機能追加: マイナーバージョンを上げる
   - バグ修正: パッチバージョンを上げる
7. `--force` を付けて上書き公開する
   - ローカルの場合:
     ```bash
     npx mir publish <name> --force
     ```
   - official-registry の場合:
     ```bash
     npx mir publish <name> --force --registry=official
     ```
7. 更新後の動作確認を行う
   ```bash
   npx mir install <name> --out-dir=/tmp/mir-update-test-<name>
   ```
8. テスト用ディレクトリを削除する

## 注意事項

- `--force` なしでは同名 snippet の上書きはできない
- version の更新を忘れないようにする
- 破壊的変更がある場合はユーザに明確に伝える
