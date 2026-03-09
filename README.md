# mir

TBSten が管理する snippet を配布・取得するツール。

## インストール

```shell
npm i -g @tbsten/mir
mir <options>

# or

npx @tbsten/mir <options>

# or

# AI Agent 経由で利用する
# skills を追加
npx skills add https://github.com/TBSten/mir --skill mir-get-started
# TODO AI Agent に "mir がインストールできたか確認して バージョンを表示して" のように質問する
```

## How to use

### Install snippet

registry に公開されている snippet を現在のディレクトリにインストールします。

```shell
mir install <name> \
    --option-1=option1value \
    --option-2=option2value
```

snippet に必須の変数が設定されているが コマンドで指定がない場合は interactive mode で入力を受け付けます (`--no-interactive` を指定するとエラーにできます)。

snippet 名を省略すると、registry 内の snippet 一覧から選択できます。

### Create snippet

独自の snippet を作成するには `create` コマンドを使用します。

```shell
mir create <name>
```

実行すると snippet の設定ファイルが `.mir/snippets/<name>.yaml` に作成されます。

次に snippet コードを `.mir/snippets/<name>/` ディレクトリ内に作成します。
ファイル名・ファイル内容には [Handlebars](https://handlebarsjs.com/) テンプレートが使えます。

変数は `.mir/snippets/<name>.yaml` の `variables` 内に JSON Schema で定義できます (任意)。

```yaml
variables:
  my-option1:
    description: "..."
    schema:
      type: string
  count:
    schema:
      type: number
      default: 3
```

テンプレートで使用している変数を自動検出して `variables` に追加するには `sync` コマンドが便利です:

```shell
mir sync <name>
```

### Publish snippet

作成した snippet を registry に公開するには `publish` コマンドを使用します。

#### ローカル registry への公開

```shell
mir publish <name>
```

既に同名の snippet が存在する場合は上書き確認が表示されます。`--force` で確認をスキップできます。

#### リモート registry への公開

リモート registry（official registry など）に公開するには、事前にログインが必要です。

```shell
# GitHub OAuth でログイン（ブラウザが開きます）
mir login

# リモート registry に公開
mir publish <name> --registry=official

# ログアウト
mir logout
```

snippet の所有権は最初に publish したユーザーに帰属します。owner のみが `--force` で上書きできます。

### Hooks

`.mir/snippets/<name>.yaml` の `hooks` で install 前後の処理を定義できます。

```yaml
hooks:
  before-install:
    - echo: "Installing {{ name }}..."
    - input:
        agree-terms:
          name: "Agree terms?"
          schema:
            type: boolean
          answer-to: agree
    - exit: true
      if: "{{ agree }}"
  after-install:
    - echo: "Done!"
```

### 標準変数

以下の変数はテンプレート内で自動的に使用できます:

| 変数名 | 説明 |
|---|---|
| `project-name` | `package.json` の `name`、なければディレクトリ名 |

## Skills for AI Agents

Claude Code 等の AI Agent 向けの skills を提供しています。

### 利用可能な Skills

| Skill | 説明 |
|---|---|
| `error-handling` | mir CLI のエラー発生時のトラブルシューティング |
| `search-snippet` | ユーザのリクエストから適切な snippet を検索・提案 |
| `getting-started` | mir のインストールと基本的な使い方を案内 |
| `extract-snippet` | 既存のプロジェクトコードから snippet を新規作成 |
| `private-mir` | .mir を git に含めず自分だけで使う設定 |
| `update-snippet` | 既存 snippet の品質チェック・最新化 |
| `review-snippet` | snippet の品質レビューと改善提案 |
| `publish-guide` | snippet の公開方法を案内 |
| `publish-snippet` | snippet を registry に公開 |
| `update-published-snippet` | 公開済の snippet を更新 |
| `find-skills` | 利用可能な mir skills を検索・表示 |

### インストール

```bash
npx skills add https://github.com/TBSten/mir --skill <skill-name>
```

## 開発

### パッケージ構成

| パッケージ | 説明 | デプロイ先 |
|---|---|---|
| `packages/cli` | CLI ツール (`npx mir`) | npm |
| `packages/web` | Web アプリ (HonoX) | Cloudflare Pages |

### コマンド

```bash
npm install
npm run dev        # 全パッケージを watch モードで起動
npm run build      # 全パッケージをビルド
npm test           # 全パッケージのテスト実行
npm run typecheck  # 型チェック
```

### デプロイ

#### packages/web (Cloudflare Pages)

```bash
npm run deploy -w packages/web
```
