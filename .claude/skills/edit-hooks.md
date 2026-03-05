# edit-hooks

snippet の hooks を設定する skill。

## 手順

1. 対象の snippet を確認する
2. `.mir/snippets/<name>.yaml` の `hooks` セクションを読み込む
3. 現在の hooks を表示する
4. ユーザの指示に基づいて hooks を追加・変更・削除する
5. YAML ファイルを更新する

## hooks の構造

```yaml
hooks:
  before-install:
    - echo: "メッセージ {{ variable }}"
    - input:
        question-key:
          name: "質問の表示名"
          description: "説明"
          schema:
            type: boolean
          answer-to: variableName
    - exit: true
      if: "{{ condition }}"
  after-install:
    - echo: "完了メッセージ"
```

## 対応アクション

| アクション | 説明 |
|---|---|
| `echo` | メッセージ表示 (Handlebars テンプレート対応) |
| `input` | ユーザ入力をして変数に格納 |
| `exit` | 条件に基づいてインストール中止 |
