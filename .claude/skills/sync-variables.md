# sync-variables

テンプレートの変数を snippet.yaml に同期する skill。

## 手順

1. 対象の snippet 名を確認する (`.mir/snippets/` 内から選択)
2. `.mir/snippets/<name>/` 内のテンプレートファイルを解析する
3. Handlebars 変数 (`{{ var }}`) を抽出する
4. `.mir/snippets/<name>.yaml` の `variables` に未定義の変数を追加する
5. 追加した変数の description や schema を適切に設定する

## コマンド

```bash
npx mir sync <name>
```

## 注意事項

- 既存の変数定義は変更されない
- 新規追加される変数のデフォルト schema は `{ type: "string" }`
- `project-name` などの標準変数は variables に定義不要
