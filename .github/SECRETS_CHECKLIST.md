# 🔧 Secrets セットアップ クイックチェックリスト

GitHub Actions 実行前に以下を完了してください。

## 📝 必須 Secrets (3つ)

### 🚀 Deploy 用（書き込み権限）

#### ☐ 1. NPM_TOKEN_PUBLISH
- **何**: npm パッケージ公開用トークン
- **用途**: Release 時の `npm publish`
- **権限**: 読み取り・書き込み + 2FA bypass

```bash
# 確認
npm login --registry=https://registry.npmjs.org
npm whoami  # → tbsten
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

#### ☐ 2. CLOUDFLARE_API_TOKEN_DEPLOY
- **何**: Cloudflare アカウント API トークン（デプロイ用）
- **用途**: Release 時の Pages デプロイ
- **権限**: Edit (Cloudflare Pages)
- **取得**: https://dash.cloudflare.com/profile/api-tokens → 「アカウント API トークン」 → "Cloudflare Pages — Edit"

```bash
# 確認
export CLOUDFLARE_API_TOKEN_DEPLOY=c4d58dxxxxx...
export CLOUDFLARE_ACCOUNT_ID=xxxxx
wrangler whoami
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

#### ☐ 3. CLOUDFLARE_ACCOUNT_ID
- **何**: Cloudflare アカウント ID
- **用途**: デプロイ時にアカウント特定
- **権限**: 不要（ID のみ）

**Status:** □ 取得完了 / □ GitHub に設定済み

---

## ✅ GitHub Secrets 登録確認

```
https://github.com/tbsten/mir/settings/secrets/actions
```

以下 3つ が表示されていることを確認:
- ☐ NPM_TOKEN_PUBLISH
- ☐ CLOUDFLARE_API_TOKEN_DEPLOY
- ☐ CLOUDFLARE_ACCOUNT_ID

---

## 🧪 検証手順

### Local でテスト

```bash
# npm 認証テスト
npm login --registry=https://registry.npmjs.org
npm whoami  # → tbsten

# Cloudflare 認証テスト
export CLOUDFLARE_API_TOKEN_DEPLOY=c4d58dxxxxx...
export CLOUDFLARE_ACCOUNT_ID=xxxxx
wrangler whoami
```

### GitHub Actions で確認

```bash
# Release を作成してデプロイをテスト
gh release create v0.0.1-alpha03 --prerelease

# ワークフロー実行状況を確認
gh run list --workflow=publish.yml
```

---

## 📋 最終確認リスト

```
☐ NPM_TOKEN_PUBLISH を取得して GitHub に設定
☐ CLOUDFLARE_API_TOKEN_DEPLOY を取得して GitHub に設定
☐ CLOUDFLARE_ACCOUNT_ID を取得して GitHub に設定
☐ GitHub Secrets ページで 3 つが全て表示される
☐ `npm whoami` がアカウント情報を返す
☐ `wrangler whoami` がアカウント情報を返す
☐ Release を作成してワークフローが正常実行される
```

**すべてチェック完了で準備完了！** 🎉

---

## 🔒 セキュリティメリット

✅ **最小権限の原則**: 各 token が必要な権限のみ保有
✅ **書き込み限定**: 公開/デプロイ権限のみ
✅ **token 紛失時**: 権限ごとに再生成（全更新不要）
✅ **シンプル**: 不要な token を設定しない

---

## 📚 詳細ドキュメント

詳細は [SECRETS.md](./SECRETS.md) を参照
