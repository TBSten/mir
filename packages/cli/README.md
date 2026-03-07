# @tbsten/mir

スニペット（ディレクトリ構造含む）を配布・取得する CLI ツール。Handlebars テンプレートで変数展開し、ファイル名・ファイル内容を動的に生成します。

## インストール

### グローバルインストール

```bash
npm install -g @tbsten/mir
mir --version
```

### npx で実行

```bash
npx @tbsten/mir --help
```

## クイックスタート

```bash
# 初期化
mir init

# スニペット一覧表示
mir list

# スニペット情報表示
mir info hello-world

# インストール
mir install hello-world --name=MyProject

# スニペット作成
mir create my-snippet

# 公開
mir publish my-snippet
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `mir init` | `.mir/` ディレクトリ初期化 |
| `mir list` | ローカル・リモートスニペット一覧 |
| `mir info <name>` | スニペット詳細情報表示 |
| `mir install <name>` | スニペットをインストール |
| `mir create <name>` | スニペット雛形作成 |
| `mir publish <name>` | スニペット公開 |
| `mir sync <name>` | スニペット定義と同期 |

## オプション

```bash
mir install hello-world \
  --name=MyProject \
  --no-interactive \
  --registry=http://localhost:3000 \
  --output=./output \
  --dry-run
```

- `--name` - 変数の値を指定
- `--no-interactive` - 非対話モード
- `--registry` - カスタム registry URL
- `--output` - 出力ディレクトリ
- `--dry-run` - プレビューモード

## 設定ファイル

`~/.mir/config.yaml`:

```yaml
registry:
  default: https://mir.tbsten.me
  custom: http://localhost:3000

editor: vim
```

## ドキュメント

詳細は [プロジェクトドキュメント](https://mir.tbsten.me/docs) を参照してください。

## ライセンス

MIT
