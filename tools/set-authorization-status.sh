#!/bin/bash
#
# 指定 snippet の認可ステータスを変更する管理者スクリプト
#
# Usage:
#   ./tools/set-authorization-status.sh <snippet-name> <status>
#
# Arguments:
#   snippet-name  対象の snippet 名
#   status        認可ステータス (approved | rejected | examination)
#
# Examples:
#   ./tools/set-authorization-status.sh react-hook approved
#   ./tools/set-authorization-status.sh bad-snippet rejected
#   ./tools/set-authorization-status.sh new-snippet examination
#
# Prerequisites:
#   - wrangler CLI がインストール済みであること
#   - Cloudflare にログイン済みであること (wrangler login)
#   - jq がインストール済みであること

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WRANGLER_CONFIG="${SCRIPT_DIR}/../packages/official-registry/wrangler.jsonc"

SNIPPET_NAME="${1:-}"
STATUS="${2:-}"

if [ -z "$SNIPPET_NAME" ] || [ -z "$STATUS" ]; then
  echo "Usage: $0 <snippet-name> <status>"
  echo "  status: approved | rejected | examination"
  exit 1
fi

# ステータスのバリデーション
if [ "$STATUS" != "approved" ] && [ "$STATUS" != "rejected" ] && [ "$STATUS" != "examination" ]; then
  echo "Error: status must be one of: approved, rejected, examination"
  echo "  Given: $STATUS"
  exit 1
fi

# wrangler.jsonc から DB 名を読み取る
if [ ! -f "$WRANGLER_CONFIG" ]; then
  echo "Error: wrangler.jsonc not found at $WRANGLER_CONFIG"
  exit 1
fi

# jsonc (コメント付き JSON) からコメントを除去して jq でパース
DB_NAME=$(sed 's|//.*||' "$WRANGLER_CONFIG" | jq -r '.d1_databases[0].database_name')

if [ -z "$DB_NAME" ] || [ "$DB_NAME" = "null" ]; then
  echo "Error: Could not read database_name from wrangler.jsonc"
  exit 1
fi

echo "Updating authorization status..."
echo "  Database: $DB_NAME"
echo "  Snippet:  $SNIPPET_NAME"
echo "  Status:   $STATUS"
echo ""

# wrangler d1 execute でリモート DB を更新
# --remote フラグで本番 D1 に接続
wrangler d1 execute "$DB_NAME" --remote --command \
  "UPDATE snippets SET authorization_status = '${STATUS}', updated_at = datetime('now') WHERE name = '${SNIPPET_NAME}';"

echo ""
echo "Done. Verifying..."

# 結果確認
wrangler d1 execute "$DB_NAME" --remote --command \
  "SELECT name, authorization_status, updated_at FROM snippets WHERE name = '${SNIPPET_NAME}';"
