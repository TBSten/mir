# mir logout

registry からログアウトし、保存された publish token を削除する。

## 概要

```bash
mir logout [--registry <name>] [--local]
```

## フロー

1. 設定ファイルから指定 registry の `publish_token` を削除
   - デフォルト: `~/.mir/config.yaml`（グローバル）
   - `--local` 指定時: `.mir/config.local.yaml`（プロジェクトローカル個人設定）
2. 設定ファイルを上書き保存

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry <name>` | 対象 registry 名 | `official` |
| `--local` | `.mir/config.local.yaml` から token を削除 | (グローバル設定から削除) |

## 関連

- [mir login](./login.md) - ログイン
