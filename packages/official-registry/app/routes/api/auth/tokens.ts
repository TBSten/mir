/**
 * GET/POST /api/auth/tokens
 * GET: token 一覧
 * POST: token 発行
 */
import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import { verifyJwt, generateApiToken, sha256 } from "../../../lib/auth.js";

export default createRoute(async (c) => {
  const authSecret = (c.env as any)?.AUTH_SECRET;
  if (!authSecret) {
    return c.json({ error: "AUTH_SECRET is not configured" }, 500);
  }

  const sessionToken = getCookie(c, "mir_session");
  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await verifyJwt(sessionToken, authSecret);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = (c.env as any)?.D1 as D1Database | undefined;
  if (!db) {
    return c.json({ error: "Database is not available" }, 500);
  }

  if (c.req.method === "POST") {
    let body: { name?: string } = {};
    try {
      body = await c.req.json();
    } catch {
      // empty body is fine
    }

    const tokenName = body.name || "API Token";
    const token = generateApiToken();
    const tokenHash = await sha256(token);

    await db
      .prepare(
        "INSERT INTO api_tokens (user_id, token_hash, name) VALUES (?, ?, ?)",
      )
      .bind(user.sub, tokenHash, tokenName)
      .run();

    return c.json({ token, name: tokenName }, 201);
  }

  // GET: token 一覧
  const tokens = await db
    .prepare(
      "SELECT id, name, last_used, created_at, expires_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(user.sub)
    .all();

  return c.json({ tokens: tokens.results });
});
