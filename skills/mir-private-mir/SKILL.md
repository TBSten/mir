---
name: mir-private-mir
description: .mir ディレクトリを自分だけが使えるようにし、git には含めないように設定する。「.mir を git に含めたくない」「自分だけ使いたい」「チームメンバーには見せたくない」と言った場合に使用する。
---

# private-mir

.mir ディレクトリを自分だけが使えるようにし、git には含めないように設定する skill。

## トリガー

ユーザが「.mir を git に含めたくない」「自分だけ使いたい」「チームメンバーには見せたくない」と言った場合に使用する。

## 手順

1. `.mir` が git に commit されないように `.git/info/exclude` に追記する
   ```bash
   echo ".mir" >> .git/info/exclude
   ```
2. 既に `.mir` が git に追跡されている場合は追跡を解除する
   ```bash
   git rm -r --cached .mir
   ```
3. 設定が正しく反映されたか確認する
   ```bash
   git status
   ```

## 注意事項

- `.gitignore` に `.mir` を追加する方法は**使わない**（チームの `.gitignore` を汚さないため）
- `.git/info/exclude` はローカルのみ有効で、他のメンバーに影響しない
- 既に commit 済みの `.mir` がある場合、`git rm --cached` は履歴からは削除しない点をユーザに伝える
