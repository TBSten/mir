# GitHub Actions Workflows

mir プロジェクトの自動化ワークフロー説明。

## ワークフロー一覧

### 1. CI (ci.yml)

**トリガー**: push (main) または PR

**実行内容:**
- ✅ Node.js 18, 20 での多重テスト
- ✅ TypeScript 型チェック
- ✅ ビルド確認
- ✅ ユニットテスト実行
- ✅ CLI バイナリ検証
- ✅ Web ビルド検証
- ✅ E2E テスト（PR時のみ）

**実行時間**: 約 3-5 分

**成功条件:**
- すべてのテストが通過
- ビルドが成功
- 型チェックエラーなし

### 2. Publish (publish.yml)

**トリガー**: Git tag を push（`v*` パターン）

**例:**
```bash
git tag v0.0.1-alpha02
git push origin v0.0.1-alpha02
```

**実行内容:**
1. CI チェック（テスト・ビルド）
2. npm publish:
   - @tbsten/mir-core --tag alpha
   - @tbsten/mir-registry-sdk --tag alpha
   - @tbsten/mir --tag alpha
3. Cloudflare Pages デプロイ
4. GitHub Release 作成

**実行時間**: 約 5-10 分

**前提条件:**
- CI チェック成功
- npm token (NPM_TOKEN)
- Cloudflare token (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)

**成功後:**
- npm.js にパッケージ公開
- mir.tbsten.me にデプロイ
- GitHub Release 自動生成

### 3. Manual Publish (manual-publish.yml)

**トリガー**: 手動実行（GitHub UI または gh CLI）

```bash
# GitHub CLI での実行
gh workflow run manual-publish.yml \
  -f version=0.0.1-alpha02 \
  -f publish_npm=true \
  -f deploy_cf=true
```

**入力パラメータ:**
- `version` (必須): 公開バージョン（例: 0.0.1-alpha02）
- `publish_npm` (デフォルト: true): npm に公開するか
- `deploy_cf` (デフォルト: true): Cloudflare にデプロイするか

**使用例:**
- npm だけ公開: `publish_npm=true, deploy_cf=false`
- Cloudflare だけ: `publish_npm=false, deploy_cf=true`
- 両方: `publish_npm=true, deploy_cf=true`

**実行時間**: 約 5-10 分

---

## Secrets 設定（必須）

GitHub Settings → Secrets → Actions に以下を設定：

### NPM_TOKEN

npm の granular access token。

**取得方法:**
1. https://www.npmjs.com/settings/tbsten/tokens
2. 新規トークン作成
3. Type: Granular Access Token
4. Permissions: Package access (read & write)
5. **重要**: "Bypass 2FA for publish" をチェック

```bash
# 確認
echo "NPM_TOKEN=$NPM_TOKEN" | npm login
npm whoami
```

### CLOUDFLARE_API_TOKEN

Cloudflare API token。

**取得方法:**
1. https://dash.cloudflare.com/profile/api-tokens
2. 新規トークン作成
3. Template: "Cloudflare Pages - Edit"

### CLOUDFLARE_ACCOUNT_ID

Cloudflare アカウント ID。

**確認方法:**
1. https://dash.cloudflare.com
2. Settings → General
3. Account ID をコピー

---

## 実行フロー

### 通常フロー（Tag push）

```
git tag v0.0.1-alpha02
git push origin v0.0.1-alpha02
    ↓
GitHub Actions: CI チェック
    ↓
GitHub Actions: npm publish
    ↓
GitHub Actions: Cloudflare deploy
    ↓
GitHub Actions: Release 作成
    ↓
✅ 完了
```

### 緊急フロー（手動実行）

```
GitHub UI → "Manual Publish" → Run workflow
    ↓
パラメータ入力（version, publish?, deploy?）
    ↓
GitHub Actions: 実行
    ↓
✅ 完了
```

---

## トラブルシューティング

### npm publish 失敗

**エラー: "403 Forbidden"**
- NPM_TOKEN の確認（2FA bypass が有効か）
- npm account の @tbsten スコープ権限確認

**エラー: "already published"**
- 同じバージョンは再発行不可
- バージョンを上げて再実行

### Cloudflare deploy 失敗

**エラー: "Account ID invalid"**
- CLOUDFLARE_ACCOUNT_ID が正しいか確認
- https://dash.cloudflare.com で確認

**エラー: "API token expired"**
- Cloudflare トークンを再生成
- Settings → Secrets で更新

### GitHub Release 失敗

- GitHub default token は自動で GITHUB_TOKEN が使用される
- 権限不足の場合は管理者に相談

---

## ログ確認

GitHub UI で実行ログ確認:

1. https://github.com/tbsten/mir/actions
2. ワークフロー選択
3. 実行ログをクリック
4. 各ステップのログを確認

### CLI での確認

```bash
gh workflow list
gh run list --workflow=publish.yml
gh run view <RUN_ID>
```

---

## Best Practices

✅ **推奨**
- CI が通ってから tag を push する
- Changelog を更新してからリリース
- 本番デプロイ前に alpha で テスト
- 手動デプロイはテスト後に実行

❌ **非推奨**
- 連続で複数回 publish を試行
- テストなしで本番リリース
- Secrets を commit に含める
- 古いバージョンを再発行

---

## リファレンス

- [GitHub Actions ドキュメント](https://docs.github.com/actions)
- [npm publish](https://docs.npmjs.com/cli/publish)
- [Cloudflare Wrangler Pages](https://developers.cloudflare.com/workers/wrangler/commands/#pages-deploy)
