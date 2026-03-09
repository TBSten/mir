/**
 * POST /api/snippets - リモート registry に snippet を publish
 */

import { createRoute } from "honox/factory";
import type { PublishPayload } from "../../lib/publish-handler.js";
import {
  validateAuthToken,
  saveSnippetToD1,
  PublishError,
} from "../../lib/publish-handler.js";

export default createRoute(async (c) => {
  try {
    // 認証チェック
    const authHeader = c.req.header("Authorization");
    const publishToken = (c.env as any)?.PUBLISH_API_TOKEN;

    validateAuthToken(authHeader, publishToken);

    // リクエストボディをパース
    let payload: PublishPayload;
    try {
      payload = await c.req.json();
    } catch {
      return c.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // バリデーション
    if (!payload.definition || !payload.definition.name) {
      return c.json(
        { error: "Missing 'definition.name' in request" },
        { status: 400 }
      );
    }

    if (!payload.files || typeof payload.files !== "object") {
      return c.json(
        { error: "Missing or invalid 'files' in request" },
        { status: 400 }
      );
    }

    // D1 へ保存
    const db = (c.env as any)?.D1;
    if (!db) {
      return c.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    await saveSnippetToD1(db, payload, payload.force ?? false);

    return c.json(
      { message: `Snippet '${payload.definition.name}' published successfully` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof PublishError) {
      return c.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Publish error:", error);
    return c.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
