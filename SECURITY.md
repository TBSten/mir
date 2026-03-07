# Security Policy

## セキュリティ上の懸念について

mir プロジェクトではセキュリティを重要視しています。セキュリティの脆弱性を発見した場合は、責任ある方法で報告してください。

## セキュリティ脆弱性の報告

**重要**: セキュリティ脆弱性を公開で報告しないでください。GitHub Issues での報告は避けてください。

セキュリティ脆弱性を発見した場合は、以下の方法で報告してください：

### Email での報告（推奨）

```
security@tbsten.me
```

報告には以下を含めてください：
- 脆弱性の説明
- 影響を受けるバージョン
- 再現手順（可能な場合）
- 提案される修正（可能な場合）

### Response Timeline

- **24時間以内**: 報告受領確認
- **7日以内**: 初期調査結果
- **30日以内**: 修正版リリース予定日を通知

## サポートされているバージョン

現在、以下のバージョンはセキュリティアップデートを受け取ります：

| バージョン | サポート状態 |
|-----------|-----------|
| 0.0.1-alpha02 | ✅ Active |
| 0.0.1-alpha01 | ⚠️ Limited |

**注**: まだ alpha バージョンのため、セキュリティアップデートは保証されません。

## セキュリティ対策

### 依存関係管理

- npm audit で脆弱性をスキャン
- 定期的な依存関係の更新

```bash
npm audit
npm update
```

### コード品質

- TypeScript での型安全性確保
- ESLint による静的解析
- テストによる動作確認

### テンプレートエンジン

Handlebars テンプレートは Sandbox 環境で実行されます：

```typescript
// テンプレートインジェクション対策
expandTemplate(userTemplate, userVariables);
// ⚠️ ユーザー入力のテンプレートはサニタイズしてください
```

## ベストプラクティス

### CLI 使用時

```bash
# ✅ 信頼できる registry を使用
mir install snippet --registry=https://mir.tbsten.me

# ❌ 信頼できない URL からスニペットを取得しない
mir install snippet --registry=http://untrusted.com
```

### Registry 実装時

```typescript
// ✅ Input validation を行う
validateSnippetYaml(data, schema);

// ❌ ユーザー入力を直接使用しない
fs.writeFileSync(userInput, content);
```

### テンプレート処理

```typescript
// ✅ データをテンプレート変数として渡す
expandTemplate(template, variables);

// ❌ テンプレート文字列に直接連結しない
const unsafe = `Hello ${userName}!`; // XSS リスク
```

## セキュリティ監査

このプロジェクトはまだセキュリティ監査を受けていません。本番環境での使用前に、自社のセキュリティチームでレビューしてください。

## その他

- [ライセンス](./LICENSE)
- [貢献ガイド](./CONTRIBUTING.md)
