/**
 * GET /api/compare - 複数スニペットの比較データを JSON で返す
 */

import { createRoute } from "honox/factory";
import { staticProvider } from "../../lib/provider.js";

interface ComparisonData {
  snippets: Array<{
    name: string;
    description?: string;
    version?: string;
    tags?: string[];
    variables?: Record<string, unknown>;
    files?: string[];
  }>;
  timestamp: string;
}

export default createRoute(async (c) => {
  const compareParam = c.req.query("compare") ?? c.req.query("names") ?? "";

  if (!compareParam) {
    return c.json(
      { error: "Missing 'compare' or 'names' parameter" },
      { status: 400 }
    );
  }

  // カンマ区切りで snippet 名をパース
  const names = compareParam
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (names.length === 0) {
    return c.json(
      { error: "No valid snippet names provided" },
      { status: 400 }
    );
  }

  // 重複を排除
  const uniqueNames = Array.from(new Set(names));

  // 各 snippet の詳細を取得
  const snippetDetails = await Promise.all(
    uniqueNames.map((name) => staticProvider.get(name))
  );

  // 比較データを構築
  const comparisonData: ComparisonData = {
    snippets: uniqueNames.map((name, idx) => {
      const detail = snippetDetails[idx];
      return {
        name,
        description: detail?.definition.description,
        version: detail?.definition.version,
        tags: detail?.definition.tags,
        variables: detail?.definition.variables,
        files: detail ? Array.from(detail.files.keys()) : [],
      };
    }),
    timestamp: new Date().toISOString(),
  };

  return c.json(comparisonData);
});
