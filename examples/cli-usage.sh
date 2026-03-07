#!/bin/bash

# @tbsten/mir (CLI) の使用例

# 初期化（初回実行時）
echo "=== Initialize mir ==="
mir init

# スニペット一覧表示
echo -e "\n=== List snippets ==="
mir list

# スニペット詳細情報表示
echo -e "\n=== Show snippet info ==="
mir info hello-world

# スニペットのインストール（対話的）
echo -e "\n=== Install snippet (interactive) ==="
mir install hello-world

# スニペットのインストール（非対話的）
echo -e "\n=== Install snippet (non-interactive) ==="
mir install hello-world \
  --name=MyProject \
  --no-interactive

# スニペットのインストール（カスタム出力ディレクトリ）
echo -e "\n=== Install to custom directory ==="
mir install hello-world \
  --name=MyProject \
  --output=./my-output

# ドライランモード（プレビュー）
echo -e "\n=== Preview without writing files ==="
mir install hello-world \
  --name=MyProject \
  --dry-run

# カスタム registry を使用
echo -e "\n=== Use custom registry ==="
mir install hello-world \
  --registry=http://localhost:3000 \
  --name=MyProject

# スニペット作成
echo -e "\n=== Create new snippet ==="
mir create my-custom-snippet

# スニペット公開
echo -e "\n=== Publish snippet ==="
mir publish my-custom-snippet

# スニペット定義と template を同期
echo -e "\n=== Sync snippet ==="
mir sync my-custom-snippet

# グローバルオプション
echo -e "\n=== Use global options ==="
mir \
  --config=~/.mir/custom-config.yaml \
  list

# ヘルプ表示
echo -e "\n=== Show help ==="
mir --help
mir install --help

# バージョン確認
echo -e "\n=== Version ==="
mir --version
