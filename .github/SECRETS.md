# GitHub Actions Secrets セットアップガイド

GitHub Actions ワークフローで必要な secrets 設定。読み書き権限を分離してセキュリティを強化。

## 📋 必要な Secrets（合計 5つ）

### 🔍 CI/Test 用（読み取り専用）


| Secret                      | 用途                    | 権限        |
| --------------------------- | --------------------- | --------- |
| `NPM_TOKEN_READ`            | npm info で package 確認 | Read-only |
| `CLOUDFLARE_API_TOKEN_READ` | ヘルスチェック等              | Read-only |


### 🚀 Deploy 用（書き込み権限）


| Secret                        | 用途                    | 権限                     |
| ----------------------------- | --------------------- | ---------------------- |
| `NPM_TOKEN_PUBLISH`           | npm パッケージ公開           | Read & Write (Publish) |
| `CLOUDFLARE_API_TOKEN_DEPLOY` | Cloudflare Pages デプロイ | Edit                   |
| `CLOUDFLARE_ACCOUNT_ID`       | Cloudflare アカウント ID   | -                      |


---

## 1️⃣ NPM_TOKEN_READ (CI 用・読み取り専用)

### 説明

npm registry への読み取り専用トークン。CI で `npm view`/`npm info` を実行する際に使用。

### 取得方法

1. [https://www.npmjs.com/settings/tbsten/tokens](https://www.npmjs.com/settings/tbsten/tokens) にアクセス
2. "Generate New Token" → **Granular Access Token** を選択
3. **権限設定（読み取り専用）:**
  ```
   ✅ Package access: read-only
   ❌ Bypass 2FA: 不要
  ```
4. トークンをコピー

### 検証方法

```bash
npm view @tbsten/mir-core@alpha version
```

### GitHub 設定

```
Settings → Secrets → Actions → New secret
Name: NPM_TOKEN_READ
Value: npm_xxxxxxx
```

---

## 2️⃣ NPM_TOKEN_PUBLISH (Deploy 用・書き込み権限)

### 説明

npm registry への公開権限トークン。Release 時の `npm publish` に使用。

### 取得方法

1. [https://www.npmjs.com/settings/tbsten/tokens](https://www.npmjs.com/settings/tbsten/tokens) にアクセス
2. "Generate New Token" → **Granular Access Token** を選択
3. **権限設定（公開用）:**
  ```
   ✅ Package access: read & write
   ✅ Organization access: read & write
   ✅ Bypass 2FA for publish ← 必須！
  ```
4. トークンをコピー

### 検証方法

```bash
npm login --registry=https://registry.npmjs.org
npm whoami  # → tbsten
```

### GitHub 設定

```
Settings → Secrets → Actions → New secret
Name: NPM_TOKEN_PUBLISH
Value: npm_xxxxxxx
```

---

## 3️⃣ CLOUDFLARE_API_TOKEN_READ (CI 用・読み取り専用)

### 説明

Cloudflare アカウント API トークン（読み取り専用）。ヘルスチェック等に使用。
ユーザーアカウントに関連付けられていない認証情報のため、Cloudflare より推奨。

### 取得方法

1. [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. 右上「アカウント API トークン」セクション（または「API トークン」タブ内）
3. **「ユーザー API トークンを作成」→ アカウント API トークン を選択**
4. **権限設定（読み取り専用）:**
  ```
   Account - Account Settings: Read
   すべてのアカウント リソースにアクセス可能
  ```
5. トークンをコピー（`c4d58dxxxxx` 形式）

### 検証方法

```bash
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN_READ" \
  https://api.cloudflare.com/client/v4/accounts
```

### GitHub 設定

```
Settings → Secrets → Actions → New secret
Name: CLOUDFLARE_API_TOKEN_READ
Value: c4d58dxxxxx...
```

---

## 4️⃣ CLOUDFLARE_API_TOKEN_DEPLOY (Deploy 用・Edit 権限)

### 説明

Cloudflare アカウント API トークン（Edit 権限）。Release 時の Pages デプロイに使用。
ユーザーアカウントに関連付けられていない認証情報のため、Cloudflare より推奨。

### 取得方法

1. [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. 右上「アカウント API トークン」セクション（または「API トークン」タブ内）
3. **「アカウント API トークンを作成」→ "Cloudflare Pages — Edit" Template を選択**
4. この template で自動設定:
  - Account Resources: Cloudflare Pages
  - Permissions: Edit (Pages)
5. トークンをコピー（`c4d58dxxxxx` 形式）

### 検証方法

```bash
export CLOUDFLARE_API_TOKEN_DEPLOY=c4d58dxxxxx...
export CLOUDFLARE_ACCOUNT_ID=xxxxx
wrangler whoami
```

### GitHub 設定

```
Settings → Secrets → Actions → New secret
Name: CLOUDFLARE_API_TOKEN_DEPLOY
Value: c4d58dxxxxx...
```

---

## 5️⃣ CLOUDFLARE_ACCOUNT_ID

### 説明

Cloudflare アカウント ID。Deploy 時に必要。

### 取得方法

1. [https://dash.cloudflare.com](https://dash.cloudflare.com) にアクセス
2. Settings → General
3. Account ID をコピー（例: e1f305e305fac0afa279aa56fa711f2c）

### GitHub 設定

```
Settings → Secrets → Actions → New secret
Name: CLOUDFLARE_ACCOUNT_ID
Value: e1f305e305fac0afa279aa56fa711f2c
```

---

## ✅ セットアップチェックリスト

```
☐ NPM_TOKEN_READ (読み取り専用) を取得・設定
☐ NPM_TOKEN_PUBLISH (書き込み) を取得・設定
☐ CLOUDFLARE_API_TOKEN_READ (読み取り専用) を取得・設定
☐ CLOUDFLARE_API_TOKEN_DEPLOY (Edit) を取得・設定
☐ CLOUDFLARE_ACCOUNT_ID を取得・設定
☐ GitHub Secrets に全 5 つが登録済み確認
```

---

## 🔒 セキュリティメリット

✅ **読み取り専用 token の漏洩**: データ参照のみ可能（修正不可）
✅ **書き込み token の漏洩**: 限定的な権限（公開/デプロイのみ）
✅ **token 紛失時**: 権限ごとに再生成（全 token 再生成不要）
✅ **CI での不要な権限**: 読み取り専用 token で実行（安全）

---

## 🚀 ワークフロー動作

### CI (ci.yml)

```
NPM_TOKEN_READ を使用 → npm view で package 確認
CLOUDFLARE_API_TOKEN_READ を使用 → ヘルスチェック
```

### Publish (publish.yml)

```
NPM_TOKEN_PUBLISH を使用 → npm publish 実行
CLOUDFLARE_API_TOKEN_DEPLOY を使用 → Pages デプロイ
CLOUDFLARE_ACCOUNT_ID を使用 → アカウント特定
```

### Manual Publish (manual-publish.yml)

```
必要な token のみ使用（フレキシブル）
```

---

## 📚 参考

- [npm Granular Access Tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [Cloudflare API Tokens](https://developers.cloudflare.com/api/tokens/create/)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

