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

利用したいスニペットを {{TODO: Web アプリをデプロイしたらここのURLを入れる}} から検索します。

公開されている snippet を現在のディレクトリにローカルにコピーするには install (or i) を使用します。

```shell
mir install <name> \
    --option-1=option1value \
    --option-2=option2value
```

snippet に必須の option が設定されているが コマンドで指定がない場合は interactive mode で入力を受け付けます (--no-interective を指定するとエラーにできます)。

### Create snippet and request publish

独自の snippet を公開したい場合は create (or c) コマンドを利用できます。

```shell
mir create <name>
```

実行すると snippet の設定ファイルが `.mir/snippets/<name>.yaml` に作成されます。

次に snippet コードを `.mir/snippets/<name>/` ディレクトリ内に作成します。

- `-` と `-` で囲ったディレクトリ, ファイル内のテキストは option として扱われます。 {{TODO: template engine の仕組みに合わせる }}
- snippet のファイルは {{TODO: 採用する template engine を決める}} の template として扱われます。

変数は `.mir/snippets/<name>.yaml` の `variables` 内に JSON Schema などで定義ができます。(任意)

```yaml
variables:
  my-option1:
    name: my-option1 # default: キー名
    description: "..."
    schema: # my-option1 の JSON Schema
      type: string
  # ... other
```

`.mir/snippets/<name>.yaml` の `hooks` に snippet の install 前後に実行したい処理を記載できます。
現在は input, echo, exit をサポートしています。

```yaml
hooks:
  before-install:
    - input:
        agree-terms:
          name: "Agree terms?"
          description: "..."
          schema: # json schema
            type: boolean
          answer-to: agree
    - exit: true
      if: "${{ agree }}"
    - echo: "Hello mir from ${{ project-name }} !"
    # ...
  after-install:
    # ...
```

作成した snippet は他の公開されたコマンドと同じように install コマンドで利用できます。

作成した snippet を公開して他のユーザも利用できるようにしたい場合は `publish` コマンドを利用します。
ログインが必要です (`mir login` で事前に認証してください)。

```shell
mir publish <name>
```

## 開発

### パッケージ構成

| パッケージ | 説明 |
|---|---|
| `packages/cli` | CLI ツール (`npx mir`) |
| `packages/web` | Web アプリ (Next.js) |

### コマンド

```bash
pnpm install
pnpm dev        # 全パッケージを watch モードで起動
pnpm build      # 全パッケージをビルド
pnpm test       # 全パッケージのテスト実行
pnpm typecheck  # 型チェック
```
