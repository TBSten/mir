/**
 * POST /api/snippets - snippet を publish (D1 に保存)
 * Authorization: Bearer <PUBLISH_API_TOKEN>
 */

import { createRoute } from "honox/factory";
import { PublishError, saveSnippetToD1, validateAuthToken } from "../../lib/publish-handler.js";

export default createRoute(async (c) => {
  // D1 が設定されているかチェック
  if (!(c.env as any)?.D1) {
    return c.json({ error: "D1 database is not configured" }, 500);
  }

  // 認証チェック
  try {
    const authHeader = c.req.header("Authorization");
    const token = (c.env as any)?.PUBLISH_API_TOKEN;
    validateAuthToken(authHeader, token);
  } catch (error) {
    if (error instanceof PublishError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    return c.json({ error: "Unauthorized" }, 401);
  }

  // リクエストボディを解析
  let payload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // ペイロード検証
  if (!payload.definition || !payload.files || typeof payload.files !== "object") {
    return c.json(
      { error: "Missing or invalid 'definition' or 'files'" },
      400
    );
  }

  if (!payload.definition.name) {
    return c.json({ error: "Missing 'definition.name'" }, 400);
  }

  // D1 に保存
  try {
    await saveSnippetToD1((c.env as any).D1, payload, payload.force || false);
    return c.json(
      {
        message: "Snippet published successfully",
        name: payload.definition.name,
      },
      201
    );
  } catch (error) {
    if (error instanceof PublishError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    return c.json(
      { error: "Failed to publish snippet" },
      500
    );
  }
});
