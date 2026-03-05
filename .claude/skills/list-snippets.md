# list-snippets

ローカル/registry の snippet 一覧を表示する skill。

## 手順

1. ローカル snippet の一覧を取得:
   - `.mir/snippets/*.yaml` を走査
2. registry の snippet 一覧を取得:
   - `~/.mir/config.yaml` の registries を読み込む
   - 各 registry ディレクトリ内の `*.yaml` を走査
3. 結果を整形して表示する

## ファイルパス

- ローカル snippet: `.mir/snippets/<name>.yaml`
- グローバル config: `~/.mir/config.yaml`
- ローカル config: `.mir/config.yaml`
- デフォルト registry: `~/.mir/registry/`
