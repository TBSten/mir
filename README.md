# mir

スニペット(ディレクトリ構造含む)を配布・取得するツール。

## パッケージ構成

| パッケージ | 説明 |
|---|---|
| `packages/cli` | CLI ツール (`npx mir`) |
| `packages/web` | Web アプリ (Next.js) |

## 開発

```bash
pnpm install
pnpm dev        # 全パッケージを watch モードで起動
pnpm build      # 全パッケージをビルド
pnpm test       # 全パッケージのテスト実行
pnpm typecheck  # 型チェック
```
