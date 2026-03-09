---
name: find-skills
description: 利用可能な mir skills を検索・一覧表示する。「mir でできることは？」「どんな skill がある？」「mir の機能を知りたい」「skill を探して」と言った場合に使用する。
---

# find-skills

利用可能な mir skills を検索・表示する skill。

## 利用可能な Skills

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

## インストール方法

```bash
npx skills add https://github.com/TBSten/mir --skill <skill-name>
```

## 全スキルを一括インストール

```bash
npx skills add https://github.com/TBSten/mir
```
