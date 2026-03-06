/**
 * GET /api/stats/<name> - snippet のインストール統計を取得
 * POST /api/stats/<name> - インストール数をインクリメント
 */

import { createRoute } from "honox/factory";
import { getInstallCount, incrementInstallCount } from "../../../lib/kv-stats.js";

export default createRoute(async (c) => {
  const name = c.req.param("name") ?? "";
  const kv = c.env.STATS_KV as KVNamespace | undefined;

  // KVNamespace が利用可能でない場合はダミーデータを返す
  if (!kv) {
    return c.json({
      name,
      count: Math.floor(Math.random() * 100) + 1,
      demo: true,
    });
  }

  if (c.req.method === "POST") {
    // インストール数をインクリメント
    const count = await incrementInstallCount(kv, name);
    return c.json({ name, count, updated: true }, { status: 200 });
  }

  // GET リクエスト: インストール数を取得
  const count = await getInstallCount(kv, name);
  return c.json({ name, count });
});
