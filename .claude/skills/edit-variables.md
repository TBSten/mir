# edit-variables

snippet の変数定義を確認・編集する skill。

## 手順

1. 対象の snippet を確認する
2. `.mir/snippets/<name>.yaml` の `variables` セクションを読み込む
3. 現在の変数定義を表示する
4. ユーザの指示に基づいて変数を追加・変更・削除する
5. YAML ファイルを更新する

## 変数定義の構造

```yaml
variables:
  variableName:
    name: "表示名"           # 省略可
    description: "説明"      # 省略可
    suggests:               # 選択肢 (省略可)
      - "option1"
      - "option2"
    schema:
      type: string          # string | number | boolean
      default: "value"      # デフォルト値 (省略可)
      enum: [...]           # 許可値リスト (省略可)
```

## 注意事項

- 変数名はテンプレート内の `{{ variableName }}` と一致させる
- `mir sync` で自動検出した変数を手動で詳細設定する際に使う
