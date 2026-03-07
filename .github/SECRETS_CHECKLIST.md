# 🔧 Secrets セットアップ クイックチェックリスト

GitHub Actions 実行前に以下を完了してください。

## 📝 必須 Secrets (5つ)

### 🔍 CI/Test 用（読み取り専用）

#### ☐ 1. NPM_TOKEN_READ
- **何**: npm パッケージ情報の読み取り専用トークン
- **用途**: CI での `npm view`/`npm info`
- **権限**: 読み取り専用

```bash
# 確認
npm view @tbsten/mir-core@alpha version
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

#### ☐ 2. CLOUDFLARE_API_TOKEN_READ
- **何**: Cloudflare API 読み取り専用トークン
- **用途**: ヘルスチェック等
- **権限**: 読み取り専用

**Status:** □ 取得完了 / □ GitHub に設定済み

---

### 🚀 Deploy 用（書き込み権限）

#### ☐ 3. NPM_TOKEN_PUBLISH
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

#### ☐ 4. CLOUDFLARE_API_TOKEN_DEPLOY
- **何**: Cloudflare API デプロイトークン
- **用途**: Release 時の Pages デプロイ
- **権限**: Edit (Cloudflare Pages)

```bash
# 確認
wrangler whoami
```

**Status:** □ 取得完了 / □ GitHub に設定済み

---

#### ☐ 5. CLOUDFLARE_ACCOUNT_ID
- **何**: Cloudflare アカウント ID
- **用途**: デプロイ時にアカウント特定
- **権限**: 不要（ID のみ）

**Status:** □ 取得完了 / □ GitHub に設定済み

---

## ✅ GitHub Secrets 登録確認

```
https://github.com/tbsten/mir/settings/secrets/actions
```

以下 5つ が表示されていることを確認:
- ☐ NPM_TOKEN_READ
- ☐ NPM_TOKEN_PUBLISH
- ☐ CLOUDFLARE_API_TOKEN_READ
- ☐ CLOUDFLARE_API_TOKEN_DEPLOY
- ☐ CLOUDFLARE_ACCOUNT_ID

---

## 🧪 検証手順

### Local でテスト

```bash
# npm 認証テスト
npm view @tbsten/mir-core@alpha version

# Cloudflare 認証テスト
export CLOUDFLARE_API_TOKEN_DEPLOY=v1.0xxx
export CLOUDFLARE_ACCOUNT_ID=xxxxx
wrangler whoami
```

### GitHub Actions で確認

```bash
# CI テストが成功することを確認
# → Actions タブで最新の workflow を確認

# Release を作成してデプロイをテスト
gh release create v0.0.1-alpha02 --prerelease

# ワークフロー実行状況を確認
gh run list --workflow=publish.yml
```

---

## 📋 最終確認リスト

```
☐ NPM_TOKEN_READ を取得して GitHub に設定
☐ NPM_TOKEN_PUBLISH を取得して GitHub に設定
☐ CLOUDFLARE_API_TOKEN_READ を取得して GitHub に設定
☐ CLOUDFLARE_API_TOKEN_DEPLOY を取得して GitHub に設定
☐ CLOUDFLARE_ACCOUNT_ID を取得して GitHub に設定
☐ GitHub Secrets ページで5つが全て表示される
☐ `npm view @tbsten/mir-core@alpha version` が成功
☐ `wrangler whoami` がアカウント情報を返す
☐ CI が成功（test, build, typecheck 全てパス）
☐ Release を作成してワークフローが正常実行される
```

**すべてチェック完了で準備完了！** 🎉

---

## 🔒 セキュリティメリット

✅ **最小権限の原則**: 各 token が必要な権限のみ保有
✅ **読み取り安全**: 読み取り token 漏洩時のリスク最小化
✅ **書き込み限定**: 公開/デプロイ権限は Release 時のみ
✅ **token 紛失時**: 権限ごとに再生成（全更新不要）

---

## 📚 詳細ドキュメント

詳細は [SECRETS.md](./SECRETS.md) を参照
