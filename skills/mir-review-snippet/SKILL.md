---
name: mir-review-snippet
description: mir snippet の品質をレビューし、改善点を提案する。「snippet をレビューして」「品質を確認して」「公開前にチェックして」「snippet に問題がないか見て」と言った場合に使用する。
---

# review-snippet

snippet の品質をレビューし、改善点を提案する skill。

## トリガー

ユーザが「snippet をレビューして」「品質を確認して」「公開前にチェックして」と言った場合に使用する。

## 手順

1. 対象の snippet の定義ファイルとテンプレートを読む
   - `.mir/snippets/<name>.yaml`
   - `.mir/snippets/<name>/` 内の全ファイル
2. 以下の観点でレビューし、結果を報告する

### レビュー観点

#### 変数設計

- 変数名が用途を明確に表しているか
- schema の type / default / enum が適切か
- 他の変数から派生する値は default にテンプレート式を使っているか（例: `default: "{{ replace packageDir '/' '.' }}"`)
- description がインストール時のプロンプトで分かりやすいか
- suggests で選択肢が提示されているか（該当する場合）

#### テンプレート品質

- テンプレートヘルパー（lowercase, uppercase, capitalize, uncapitalize, camelCase, pascalCase, snakeCase, kebabCase, dotCase, pathCase, replace, concat, slice, trim, contains, startsWith, endsWith, length）が適切に使われているか
- 1つの変数から複数の命名規則に正しく展開されているか
- 生成コードの可読性は十分か
- 不要なハードコードがないか
- Handlebars の条件分岐・ループが適切に使われているか

#### hooks の UX

- before-install で何が起こるか説明されているか
- after-install で次のアクション（依存インストール、設定変更等）が案内されているか
- exit 条件が適切に設定されているか

#### コメント（保守性）

- snippet 定義 YAML に保守用コメントが記述されているか
- 各テンプレートファイルの元となったファイルパスが記録されているか（例: `# <name>/hoge.ts ... from src/hoge.ts`）
- snippet の意図や設計判断の経緯がコメントで残されているか
- 将来の更新者がどのように修正すればよいか分かるようになっているか

#### メタデータ

- description が snippet の目的を正確に伝えているか
- tags で検索しやすいか
- version が設定されているか

#### 安全性

- テンプレートファイル名にパストラバーサル（`..`）が含まれていないか
- 意図しないファイル上書きのリスクがないか
- snippet.yaml の `name` フィールドとファイル名が一致しているか

3. 問題点と改善案を一覧で提示する
4. ユーザの承認を得てから修正を実施する
5. 修正後、`mir sync` で変数を同期し、動作確認する
   ```bash
   npx mir sync <name>
   npx mir install <name> --out-dir=/tmp/mir-test-<name>
   ```

## 注意事項

- レビュー結果は問題の深刻度（高/中/低）を付けて報告する
- 全ての項目を満たす必要はない（snippet の用途に応じて判断する）
- hooks は必須ではないが、設定されている場合は UX を確認する
