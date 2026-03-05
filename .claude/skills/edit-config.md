# edit-config

config.yaml の設定を確認・編集する skill。

## 手順

1. 現在の設定を読み込む:
   - グローバル: `~/.mir/config.yaml`
   - ローカル: `.mir/config.yaml`
2. 設定内容を表示する
3. ユーザの指示に基づいて設定を変更する
4. YAML ファイルを更新する

## 設定ファイルの構造

```yaml
# ~/.mir/config.yaml または .mir/config.yaml
registries:
  - name: default
    path: ~/.mir/registry
  - name: team
    path: ~/shared/team-snippets
  - name: community
    url: https://example.com/mir-registry

locale: ja  # ja | en

defaults:
  author: username
```

## マージルール

- registries: ローカル先頭 + グローバル後方 (同名はローカル優先)
- defaults: ローカルで上書き
- locale: ローカル優先

## JSON Schema

`schema/v1/mirconfig.schema.json` でバリデーション可能。
