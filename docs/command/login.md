# mir login

registry にログインして publish 用の API トークンを取得する。

## 概要

```bash
mir login [--registry <name>]
```

## フロー

1. 対象 registry の URL を設定から決定（デフォルト: `official`）
2. ランダムポートで localhost HTTP サーバーを起動
3. ブラウザで `{registryUrl}/auth/login?cli=true&callback_port={port}` を開く
4. ユーザーが GitHub OAuth でログイン
5. サーバー側で API token を発行し `http://localhost:{port}/callback?token={token}` にリダイレクト
6. CLI が token を受け取り、`~/.mir/config.yaml` の該当 registry に `publish_token` として保存
7. localhost サーバーを停止

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry <name>` | 対象 registry 名 | `official` |

## 認証方式

- GitHub OAuth を使用
- `read:user` スコープのみ要求
- 発行された API token は `mir_` prefix 付き

## 設定の保存先

`~/.mir/config.yaml` の該当 registry エントリに `publish_token` フィールドとして保存される。

```yaml
registries:
  - name: official
    url: https://mir.tbsten.me
    publish_token: mir_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 関連

- [mir logout](./logout.md) - ログアウト
- [mir publish](./publish.md) - snippet の publish
