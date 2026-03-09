# mir Skills

mir CLI のための Claude Code スキル集。snippet の作成・公開・検索・レビューなどをサポートします。

## Skills 一覧

| Skill | 説明 |
|---|---|
| [getting-started](./getting-started.md) | mir のインストールと基本的な使い方を案内 |
| [search-snippet](./search-snippet.md) | ユーザのリクエストから適切な snippet を検索・提案 |
| [extract-snippet](./extract-snippet.md) | 既存のプロジェクトコードから snippet を新規作成 |
| [review-snippet](./review-snippet.md) | snippet の品質レビューと改善提案 |
| [update-snippet](./update-snippet.md) | 既存 snippet の品質チェック・最新化 |
| [publish-guide](./publish-guide.md) | snippet の公開方法を案内（ログイン・リモート registry 含む） |
| [publish-snippet](./publish-snippet.md) | snippet を registry に公開（ローカル・リモート両対応） |
| [update-published-snippet](./update-published-snippet.md) | 公開済の snippet を更新（所有権・認証対応） |
| [error-handling](./error-handling.md) | mir CLI のエラー発生時のトラブルシューティング |
| [private-mir](./private-mir.md) | .mir を git に含めず自分だけで使う設定 |
| [find-skills](./find-skills.md) | 利用可能な mir skills を検索・表示 |

## インストール

```bash
# 全スキルを一括インストール
npx skills add https://github.com/TBSten/mir

# 個別にインストール
npx skills add https://github.com/TBSten/mir --skill <skill-name>
```
