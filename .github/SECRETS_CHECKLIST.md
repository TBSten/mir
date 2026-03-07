# 🔧 Secrets セットアップ クイックチェックリスト

GitHub Actions 実行前に以下を完了してください。

## 📝 必須 Secrets (3つ)

### ☐ 1. NPM_TOKEN
- **何**: npm パッケージ公開用トークン
- **どこで取得**: https://www.npmjs.com/settings/tbsten/tokens
- **設定方法**:
  1. "Generate New Token" → Granular Access Token
  2. Permissions: ✅ Package access (read & write)
  3. ✅ **Bypass 2FA for publish** (重要！)
  4. GitHub Secrets に追加

```bash
# 確認コマンド
npm login --registry=https://registry.npmjs.org
npm whoami  # → tbsten
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

### ☐ 2. CLOUDFLARE_API_TOKEN
- **何**: Cloudflare API 認証トークン
- **どこで取得**: https://dash.cloudflare.com/profile/api-tokens
- **設定方法**:
  1. "Create Token"
  2. Template: `Cloudflare Pages — Edit`
  3. Permissions は自動設定
  4. GitHub Secrets に追加

```bash
# 確認コマンド
wrangler whoami  # → アカウント情報表示
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

### ☐ 3. CLOUDFLARE_ACCOUNT_ID
- **何**: Cloudflare アカウント ID
- **どこで取得**: https://dash.cloudflare.com → Settings → General
- **設定方法**:
  1. "Account ID" をコピー（例: e1f305e305fac0afa279aa56fa711f2c）
  2. GitHub Secrets に追加

```bash
# 確認コマンド
echo $CLOUDFLARE_ACCOUNT_ID  # → ID が表示される
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

## ✅ GitHub Secrets 登録確認

```
https://github.com/tbsten/mir/settings/secrets/actions
```

以下 3つ が表示されていることを確認:
- ☐ NPM_TOKEN
- ☐ CLOUDFLARE_API_TOKEN
- ☐ CLOUDFLARE_ACCOUNT_ID

---

## 🧪 検証

### Local でテスト

```bash
# npm 認証
npm login --registry=https://registry.npmjs.org

# Cloudflare 認証
wrangler login
# または
export CLOUDFLARE_API_TOKEN=v1.0xxx
export CLOUDFLARE_ACCOUNT_ID=xxxxx
wrangler whoami
```

### GitHub Actions で確認

```bash
# Release を作成
gh release create v0.0.1-alpha02 \
  --title "Test Release" \
  --prerelease

# ワークフロー実行状況を確認
gh run list --workflow=publish.yml
gh run view <RUN_ID>
```

---

## 🚨 よくあるエラーと対処

| エラー | 原因 | 対処 |
|-------|------|------|
| 403 Forbidden (npm) | Token 無効/権限不足 | Token を再生成して GitHub を更新 |
| Unauthorized (Cloudflare) | API Token 期限切れ | 新しい token を作成 |
| Invalid account ID | Account ID が間違い | https://dash.cloudflare.com で確認 |

---

## 📋 最終確認リスト

```
□ NPM_TOKEN を取得して GitHub に設定
□ CLOUDFLARE_API_TOKEN を取得して GitHub に設定
□ CLOUDFLARE_ACCOUNT_ID を取得して GitHub に設定
□ Local で npm whoami が tbsten を返す
□ Local で wrangler whoami がアカウント情報を返す
□ GitHub Secrets ページで3つが全て表示される
□ Release を作成してワークフローが正常実行される
```

**すべてチェック完了で準備完了！** 🎉

---

## 📚 詳細ドキュメント

詳細は [SECRETS.md](./SECRETS.md) を参照
