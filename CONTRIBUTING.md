# Contributing to mir

mir への貢献をありがとうございます！このドキュメントはコントリビューションプロセスを説明しています。

## セットアップ

```bash
# リポジトリクローン
git clone https://github.com/tbsten/mir.git
cd mir

# 依存インストール
npm install

# ビルド
npm run build

# テスト
npm test
```

## 開発ワークフロー

### ローカル開発

```bash
# 全パッケージを watch モード
npm run dev

# 個別パッケージ
npm run dev -w packages/cli
npm run dev -w packages/official-registry
```

### テスト

```bash
# 全テスト実行
npm test

# 特定パッケージのテスト
npm test -w packages/mir-core

# watch モード
npm run test:watch -w packages/cli
```

### ビルド

```bash
# 全パッケージビルド
npm run build

# CLI ビルド
npm run build:cli

# Web (Official Registry) ビルド
npm run build:web
```

### 型チェック

```bash
npm run typecheck
```

## Pull Request プロセス

1. **ブランチ作成**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **コード変更 & テスト**
   ```bash
   # 変更を実装
   # テストを追加
   npm test
   ```

3. **コミット**
   ```bash
   git add .
   git commit -m "feat: 機能説明"
   ```

4. **Push & PR 作成**
   ```bash
   git push origin feature/my-feature
   ```

## コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/) に従ってください：

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` コード整形
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` ビルド、依存関係など

## パッケージ構成

| パッケージ | 説明 |
|-----------|------|
| `@tbsten/mir-core` | コアロジック |
| `@tbsten/mir-registry-sdk` | Registry SDK |
| `@tbsten/mir` | CLI |
| `@mir/official-registry` | 公式 Registry (private) |

## ドキュメント

- [コアロジック](./packages/mir-core/README.md)
- [Registry SDK](./packages/registry-sdk/README.md)
- [CLI](./packages/cli/README.md)
- [仕様書](./docs/)

## 質問・Issue

- GitHub Issues で質問・バグ報告を受け付けています
- [Issues](https://github.com/tbsten/mir/issues)

## ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照
