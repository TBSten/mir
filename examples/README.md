# Examples

mir の各パッケージの使用例を掲載しています。

## ファイル一覧

### core-usage.ts

`@tbsten/mir-core` の使用例：

- Handlebars テンプレート展開
- スキーマ検証
- リモート Registry アクセス
- 複雑なテンプレート例

**実行:**
```bash
npx ts-node examples/core-usage.ts
```

### cli-usage.sh

`@tbsten/mir` (CLI) の使用例：

- 初期化 (`mir init`)
- スニペット一覧 (`mir list`)
- スニペット詳細 (`mir info`)
- インストール (`mir install`)
  - 対話的インストール
  - 非対話的インストール
  - カスタム出力ディレクトリ
  - ドライランモード
  - カスタム registry
- スニペット作成 (`mir create`)
- スニペット公開 (`mir publish`)
- スニペット同期 (`mir sync`)

**実行:**
```bash
bash examples/cli-usage.sh
```

### registry-sdk-usage.ts

`@tbsten/mir-registry-sdk` の使用例：

- 基本的な Registry サーバー実装
- Middleware の使用
- 環境変数に応じた設定
- Cloudflare Workers での使用
- API クライアント側の使用

**実行:**
```bash
npx ts-node examples/registry-sdk-usage.ts
```

## クイックスタート

### 1. mir をインストール

```bash
npm install -g @tbsten/mir
# または
npx @tbsten/mir@latest
```

### 2. プロジェクトを初期化

```bash
mir init
```

### 3. サンプルスニペットをインストール

```bash
mir install hello-world --name=MyProject
```

### 4. スニペットを作成・公開

```bash
mir create my-snippet
mir publish my-snippet
```

## 詳細ドキュメント

- [CLI](../packages/cli/README.md)
- [Core](../packages/mir-core/README.md)
- [Registry SDK](../packages/registry-sdk/README.md)
- [公式 Registry](../packages/official-registry/README.md)
