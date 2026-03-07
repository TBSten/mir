# GitHub Actions Secrets セットアップガイド

GitHub Actions ワークフローで必要な secrets 設定。

## 📋 必要な Secrets

| Secret | 用途 | 必須 | 取得難度 |
|--------|------|------|--------|
| `NPM_TOKEN` | npm パッケージ公開 | ✅ | 🟢 中 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Pages デプロイ | ✅ | 🟡 高 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID | ✅ | 🟢 低 |

---

## 1️⃣ NPM_TOKEN

### 説明
npm registry への認証トークン。`npm publish` に使用。

### 取得方法

**Step 1: npm.js にアクセス**
```
https://www.npmjs.com/settings/tbsten/tokens
```

**Step 2: 新規トークン作成**
- "Generate New Token" をクリック
- Type: **Granular Access Token** を選択

**Step 3: 権限設定**
```
Permissions:
  ✅ Package access (read & write)
    - @tbsten/* に対して read & write 可能
  ✅ Organization access (read & write)
  ✅ Bypass 2FA for publish ← 重要！
```

**Step 4: トークンをコピー**
```
npm_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 検証方法

```bash
export NPM_TOKEN=npm_xxxxxxx
npm login --registry=https://registry.npmjs.org
npm whoami
```

期待される出力: `tbsten`

### 設定方法

GitHub に設定:
```
Settings → Secrets and variables → Actions
→ "New repository secret"
Name: NPM_TOKEN
Value: npm_xxxxxxx
```

---

## 2️⃣ CLOUDFLARE_API_TOKEN

### 説明
Cloudflare API 認証トークン。Pages デプロイに使用。

### 取得方法

**Step 1: Cloudflare Dashboard にアクセス**
```
https://dash.cloudflare.com/profile/api-tokens
```

**Step 2: "Create Token" をクリック**

**Step 3: Template を選択**
```
Cloudflare Pages — Edit
```

この template は以下の権限で自動設定:
- Account Resources: Cloudflare Pages
- Permissions: Edit Pages

**Step 4: Account Resources 設定**
```
Include:
  ✅ All accounts (推奨)
  または
  ✅ 特定アカウント選択
```

**Step 5: トークンをコピー**
```
v1.0xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 検証方法

```bash
export CLOUDFLARE_API_TOKEN=v1.0xxx
export CLOUDFLARE_ACCOUNT_ID=xxxxx

# wrangler で検証
wrangler whoami
```

期待される出力: アカウント情報

### 設定方法

GitHub に設定:
```
Settings → Secrets and variables → Actions
→ "New repository secret"
Name: CLOUDFLARE_API_TOKEN
Value: v1.0xxxxx
```

---

## 3️⃣ CLOUDFLARE_ACCOUNT_ID

### 説明
Cloudflare アカウント ID。

### 取得方法

**Step 1: Cloudflare Dashboard にアクセス**
```
https://dash.cloudflare.com
```

**Step 2: 左サイドバー → "Settings"**

**Step 3: "General" タブ**

**Step 4: "Account ID" をコピー**
```
e1f305e305fac0afa279aa56fa711f2c  (例)
```

### 検証方法

```bash
echo $CLOUDFLARE_ACCOUNT_ID
# 結果: e1f305e305fac0afa279aa56fa711f2c
```

### 設定方法

GitHub に設定:
```
Settings → Secrets and variables → Actions
→ "New repository secret"
Name: CLOUDFLARE_ACCOUNT_ID
Value: e1f305e305fac0afa279aa56fa711f2c
```

---

## ✅ セットアップチェックリスト

- [ ] NPM_TOKEN を取得して設定
  ```bash
  npm login --registry=https://registry.npmjs.org
  npm whoami  # tbsten が表示されれば OK
  ```

- [ ] CLOUDFLARE_API_TOKEN を取得して設定
  ```bash
  wrangler whoami  # アカウント情報が表示されれば OK
  ```

- [ ] CLOUDFLARE_ACCOUNT_ID を取得して設定
  ```bash
  echo $CLOUDFLARE_ACCOUNT_ID  # ID が表示されれば OK
  ```

- [ ] GitHub Secrets に全て追加済み
  ```
  Settings → Secrets and variables → Actions
  → 3つ全て表示されている確認
  ```

---

## 🔒 セキュリティベストプラクティス

✅ **推奨:**
- Secrets は rotate する（定期的に更新）
- Granular token を使用（最小権限の原則）
- 2FA bypass は必要な場合だけ
- 本番環境のトークンと開発環境のトークンを分ける

❌ **禁止:**
- Secrets をコミットに含める
- Secrets を log に出力する
- Secrets をメール送信
- 他人と Secrets を共有

---

## 🆘 トラブルシューティング

### エラー: "403 Forbidden - npm publish"

**原因**: NPM_TOKEN が無効または権限不足

**対策:**
```bash
# Token を再生成
npm login --registry=https://registry.npmjs.org

# 新しいトークンを GitHub Secrets に設定
```

### エラー: "API token expired - Cloudflare"

**原因**: Cloudflare API token の有効期限切れ

**対策:**
```
1. https://dash.cloudflare.com/profile/api-tokens
2. 古いトークンを削除
3. 新しいトークンを作成
4. GitHub Secrets を更新
```

### エラー: "Account ID invalid"

**原因**: CLOUDFLARE_ACCOUNT_ID が不正

**対策:**
```bash
# 正しいアカウント ID を確認
# https://dash.cloudflare.com → Settings → General
# ID をコピーして GitHub Secrets に設定
```

---

## 📚 参考

- [npm granular access tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [Cloudflare API Tokens](https://developers.cloudflare.com/api/tokens/create/)
- [Wrangler Authentication](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🚀 次のステップ

Secrets を設定したら:

1. Release を作成
   ```bash
   gh release create v0.0.1-alpha02 \
     --title "Release v0.0.1-alpha02" \
     --prerelease
   ```

2. Actions を確認
   ```bash
   gh run list --workflow=publish.yml
   ```

3. デプロイ完了を確認
   ```
   npm view @tbsten/mir@alpha version
   curl https://mir.tbsten.me/health
   ```
