# mir clone

ローカル snippet を複製するコマンド。既存の draft snippet を新しい名前でコピーします。

## 使用例

### 基本的な複製

```shell
mir clone hello-world my-hello
```

`.mir/snippets/hello-world.yaml` と `.mir/snippets/hello-world/` をコピーし、`.mir/snippets/my-hello.yaml` と `.mir/snippets/my-hello/` を作成します。

### 既存 snippet 上書き

```shell
mir clone hello-world my-hello --force
```

同名の snippet が既に存在する場合、上書きします。

### ドライランで確認

```shell
mir clone hello-world my-hello --dry-run
```

実際にはコピーしないで、コピーされるファイル一覧を表示します。

## 引数

| 引数 | 必須 | 説明 |
|---|---|---|
| `source` | Yes | 複製元の snippet 名 |
| `dest` | Yes | 複製先の snippet 名 |

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--force`, `-f` | 既存 snippet を上書き | `false` |
| `--dry-run` | 実際にはコピーしないで、ファイル一覧を表示 | `false` |

## 動作の詳細

### 1. 複製元の確認

複製元の snippet が `.mir/snippets/` に存在することを確認します。

存在しない場合はエラーを返します。

```
error: snippet not found: hello-world
```

### 2. 複製先の確認

複製先の snippet が既に存在する場合:
- `--force` 指定時: 上書きを確認して進行
- 未指定時: エラーを返す

```
error: snippet already exists: my-hello
```

### 3. ファイルのコピー

`.mir/snippets/<source>.yaml` と `.mir/snippets/<source>/` を新しい名前でコピーします。

### 4. snippet 定義の更新

コピーされた `<dest>.yaml` の `name` フィールドを `<dest>` に更新します。

テンプレートファイルは変更されません。

## 関連

- [mir create](./create.md) - 新規 snippet を作成
- [mir publish](./publish.md) - snippet をローカル registry に登録
- [mir install](./install.md) - snippet をインストール
