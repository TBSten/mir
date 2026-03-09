/**
 * DELETE /api/auth/tokens/:id
 * token 削除
 */
import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "../../../../lib/auth.js";

export default createRoute(async (c) => {
  if (c.req.method !== "DELETE") {
    return c.json({ error: "Method not allowed" }, 405);
  }

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

  const tokenId = c.req.param("id");
  if (!tokenId) {
    return c.json({ error: "Missing token ID" }, 400);
  }

  // 自分の token のみ削除可能
  await db
    .prepare("DELETE FROM api_tokens WHERE id = ? AND user_id = ?")
    .bind(parseInt(tokenId, 10), user.sub)
    .run();

  return c.json({ message: "Token deleted" });
});
