# mir logout

registry からログアウトし、保存された publish token を削除する。

## 概要

```bash
mir logout [--registry <name>]
```

## フロー

1. `~/.mir/config.yaml` から指定 registry の `publish_token` を削除
2. 設定ファイルを上書き保存

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry <name>` | 対象 registry 名 | `official` |

## 関連

- [mir login](./login.md) - ログイン
