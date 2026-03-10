# mir preview

snippet をインストール前にプレビュー表示するコマンド。実際のファイルを生成することなく、展開結果を確認できます。

## 使用例

### 基本的なプレビュー

```shell
mir preview react-hook
```

snippet の構造と生成されるファイル名の一覧を表示します。

### ファイル内容も表示

```shell
mir preview react-hook --output
```

ファイル内容を詳細に表示します。

### JSON 形式で出力

```shell
mir preview react-hook --json
```

プレビュー結果を JSON 形式で出力します。

### 変数を指定してプレビュー

```shell
mir preview react-hook --name=useAuth
```

指定した変数値でテンプレートを展開し、生成結果をプレビューします。

## オプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--registry`, `-r` | 対象の registry 名 | 全 registry を順に検索 |
| `--output`, `-o` | ファイル内容を詳細表示 | `false` |
| `--json` | 結果を JSON 形式で出力 | `false` |
| `--yaml` | 結果を YAML 形式で出力 | `false` |
| `--<variable>=<value>` | snippet の変数を指定 | - |
| `--no-interactive` | インタラクティブモードを無効化 | `false` |
| `--dry-run` | install コマンド実行時に使用可能（preview と同等） | - |

## 動作の詳細

### 1. snippet の解決

`--registry` 指定時は該当 registry のみを検索。未指定時は全 registry を順に検索。

### 2. 変数の解決

1. 標準変数を解決
2. CLI 引数で指定された変数値を収集
3. 未指定の変数がある場合:
   - インタラクティブモード（デフォルト）: プロンプトで入力
   - `--no-interactive` 指定時: デフォルト値を使用（デフォルトがない場合はエラー）

### 3. テンプレートの展開

snippet 内の全ファイルを Handlebars テンプレートとして展開します。

### 4. 結果の表示

#### デフォルト（ファイル名一覧）

```
react-hook

Files:
  useAuth.ts
  useAuth.test.ts
```

#### --output 指定時（ファイル内容を含む）

```
react-hook

useAuth.ts:
───────────────────────────────────
import { useState, useCallback } from "react";

export function useAuth() {
  const [state, setState] = useState(null);

  const reset = useCallback(() => {
    setState(null);
  }, []);

  return { state, reset };
}

useAuth.test.ts:
───────────────────────────────────
import { describe, it, expect } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should work', () => {
    expect(useAuth()).toBeDefined();
  });
});
```

#### JSON 形式

```json
{
  "name": "react-hook",
  "variables": {
    "name": "useAuth"
  },
  "files": [
    {
      "path": "useAuth.ts",
      "content": "..."
    },
    {
      "path": "useAuth.test.ts",
      "content": "..."
    }
  ]
}
```

## mir install との連携

`mir install` で `--dry-run` オプションを指定すると、preview と同等の動作が行われます。

```shell
mir install react-hook --name=useAuth --dry-run
```

これは以下と同等です:

```shell
mir preview react-hook --name=useAuth --output
```

## 関連

- [mir install](./install.md) - snippet をインストール（--dry-run でプレビュー）
- [mir info](./info.md) - snippet の詳細情報を表示
