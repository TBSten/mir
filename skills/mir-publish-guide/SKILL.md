---
name: mir-publish-guide
description: mir snippet の公開方法（ローカル registry・リモート registry）をユーザに教える。「snippet の公開方法を知りたい」「publish の手順は？」「registry に登録するには？」と言った場合に使用する。
---

# publish-guide

snippet の公開方法をユーザに教える skill。

## トリガー

ユーザが「snippet の公開方法を知りたい」「publish の手順は？」「registry に登録するには？」と言った場合に使用する。

## 手順

1. ユーザの状況を確認する
   - snippet は既に作成済みか
2. **公開先を必ずユーザに確認する。** 以下の選択肢を提示すること:
   - **ローカル registry** (`~/.mir/registry/`): 自分の PC 内にのみ保存される
   - **⚠️🌍 official-registry ⚠️🌍**: **全世界の誰でも閲覧・インストール可能になります！** 公開して問題ないか十分に確認してください
3. 公開方法を案内する

### ローカル registry への公開

ローカル registry（デフォルト: `~/.mir/registry/`）に公開する方法:

1. `.mir/snippets/<name>.yaml` と `.mir/snippets/<name>/` が揃っていることを確認
2. 公開前の準備:
   ```bash
   # 変数定義を最新化
   npx mir sync <name>
   # 生成内容をプレビュー
   npx mir preview <name>
   ```
3. 公開を実行:
   ```bash
   npx mir publish <name>
   ```
4. 同名 snippet が既に存在する場合は確認プロンプトが表示される
   - `--force` でスキップ可能: `npx mir publish <name> --force`

### リモート registry への公開

リモート registry（HTTP ベース）に公開する方法:

1. まずログインして publish token を取得する:
   ```bash
   npx mir login
   # または特定の registry を指定:
   npx mir login --registry=my-remote
   ```
   ブラウザで GitHub OAuth ログインが開き、自動的に token が設定に保存される。

2. あるいは手動で `mirconfig.yaml` に `url` と `publish_token` を設定することも可能:
   ```yaml
   registries:
     - name: my-remote
       url: https://registry.example.com
       publish_token: "your-token-here"
   ```
3. 公開を実行:
   ```bash
   npx mir publish <name> --registry=my-remote
   ```
4. POST `<url>/api/snippets` に snippet 定義とファイル群が送信される
5. ログアウトする場合:
   ```bash
   npx mir logout
   ```

### 公開前の確認事項

- `mir sync <name>` で変数定義が最新か
- snippet.yaml の name, description, version, tags が適切に設定されているか
- `mir preview <name>` で生成内容に問題がないか

## 注意事項

- リモート registry は読み取り専用が基本。公開には `publish_token` が必要
- ローカル registry なら特別な認証は不要
