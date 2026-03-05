# create-snippet

新しい snippet を作成する skill。

## 手順

1. ユーザに snippet 名を確認する
2. snippet の用途・説明を確認する
3. `mir create <name>` に相当する処理を実行:
   - `.mir/snippets/<name>.yaml` を作成
   - `.mir/snippets/<name>/` ディレクトリを作成
4. ユーザの要件に基づいてテンプレートファイルを作成する
5. 変数定義 (`variables`) を `.mir/snippets/<name>.yaml` に追加する
6. 必要に応じて hooks を設定する
7. `mir sync <name>` でテンプレートと変数定義を同期する

## 注意事項

- snippet 名は英数字とハイフンのみ (`^[a-zA-Z0-9][a-zA-Z0-9-]*$`)
- テンプレートは Handlebars 構文 (`{{ variableName }}`)
- 変数の schema には type, default, enum が設定可能
- suggests でユーザに選択肢を提示できる
