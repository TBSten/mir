# find-skills

利用可能な mir skills を検索・表示する skill。

## 利用可能な Skills

| Skill | 説明 |
|---|---|
| `create-snippet` | 新しい snippet を対話的に作成 |
| `sync-variables` | テンプレートの変数を snippet.yaml に同期 |
| `publish-snippet` | snippet をローカル registry に公開 |
| `install-snippet` | registry から snippet をインストール |
| `edit-variables` | snippet の変数定義を確認・編集 |
| `list-snippets` | ローカル/registry の snippet 一覧を表示 |
| `edit-hooks` | snippet の hooks を設定 |
| `edit-config` | config.yaml の設定を確認・編集 |
| `test-snippet` | snippet の動作テスト (dry-run) |
| `find-skills` | 利用可能な mir skills を検索・表示 |

## インストール方法

```bash
npx skills add https://github.com/TBSten/mir --skill <skill-name>
```
