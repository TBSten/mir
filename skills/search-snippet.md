---
name: search-snippet
description: ユーザのリクエストから適切な mir snippet を検索・探索し、候補を提案する。「こういうコードが欲しい」「○○のテンプレートはある？」「snippet を探して」など、snippet を見つけたい場合に使用する。
---

# search-snippet

ユーザのリクエストから適切な snippet を検索・探索し、提案する skill。

## トリガー

ユーザが「こういうコードが欲しい」「○○のテンプレートはある？」など、snippet を探している場合に使用する。

## 手順

1. ユーザのリクエストから検索キーワードを抽出する
   - 技術スタック（React, Express, etc.）
   - 用途（コンポーネント, API, テスト, etc.）
   - パターン（CRUD, 認証, バリデーション, etc.）
2. `mir search <keyword>` で公開されている snippet を検索する
   ```bash
   npx mir search <keyword>
   ```
3. `mir list` で利用可能な全 snippet も確認する
   ```bash
   npx mir list
   ```
4. 候補が見つかったら `mir info <name>` で詳細を確認する
   ```bash
   npx mir info <name>
   ```
5. ユーザに 2〜10 個程度の候補を以下の情報とともに提案する:
   - snippet 名
   - description
   - 必要な変数一覧
   - tags
6. ユーザが選択したら `install-snippet` skill に引き継ぐ

## 注意事項

- 複数のキーワードで検索して網羅的に候補を集める
- ユーザの技術スタックや要件に合わない snippet は除外する
- 候補が見つからない場合は、`extract-snippet` skill で新規作成を提案する
