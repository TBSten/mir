# mir

TBSten が管理する snippet を配布・取得するツール。

## インストール

```shell
npm i -g @tbsten/mir
mir <options>

# or

npx @tbsten/mir <options>
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

```shell
mir publish <name>
```

既に同名の snippet が存在する場合は上書き確認が表示されます。`--force` で確認をスキップできます。

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
| `create-snippet` | 新しい snippet を対話的に作成 |
| `sync-variables` | テンプレートの変数を snippet.yaml に同期 |
| `publish-snippet` | snippet をローカル registry に公開 |
| `install-snippet` | registry から snippet をインストール |
| `edit-variables` | snippet の変数定義を確認・編集 |
| `list-snippets` | ローカル/registry の snippet 一覧を表示 |
| `edit-hooks` | snippet の hooks を設定 |
| `edit-config` | config.yaml の設定を確認・編集 |
| `test-snippet` | snippet の動作テスト (dry-run) |
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
