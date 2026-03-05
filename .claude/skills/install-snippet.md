# install-snippet

registry から snippet をインストールする skill。

## 手順

1. インストールする snippet 名を確認する
2. 必要な変数値を確認する
3. 出力先ディレクトリを確認する (デフォルト: カレントディレクトリ)
4. `mir install <name>` を実行する
5. 生成されたファイルを確認する

## コマンド

```bash
npx mir install <name> --key1=value1 --key2=value2
npx mir install <name> --out-dir=<path>
npx mir install <name> --registry=<registry-name>
npx mir install <name> --no-interactive  # CI 向け
```

## 標準変数

テンプレート内で自動的に使用可能な変数:

| 変数名 | 説明 |
|---|---|
| `project-name` | `package.json` の `name` またはディレクトリ名 |

## 注意事項

- 既存ファイルがある場合は上書き確認が表示される
- `--no-interactive` 時は既存ファイルがあるとエラー
