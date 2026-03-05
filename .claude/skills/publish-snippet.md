# publish-snippet

snippet をローカル registry に公開する skill。

## 手順

1. 対象の snippet 名を確認する
2. `.mir/snippets/<name>.yaml` と `.mir/snippets/<name>/` の存在を確認する
3. YAML のバリデーションを実行する
4. `mir publish <name>` を実行する
5. 既存の snippet がある場合は上書き確認する

## コマンド

```bash
npx mir publish <name>
npx mir publish <name> --force     # 確認なしで上書き
npx mir publish <name> --registry=<registry-name>  # 特定の registry に公開
```

## 注意事項

- ローカル registry のみに公開可能
- registry は `~/.mir/config.yaml` または `.mir/config.yaml` で設定
