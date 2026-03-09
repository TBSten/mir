/**
 * GET /api/auth/verify
 * Bearer token を検証し、ユーザー情報を返す
 */
import { createRoute } from "honox/factory";
import { validateApiToken } from "../../../lib/auth.js";

export default createRoute(async (c) => {
  const db = (c.env as any)?.D1 as D1Database | undefined;
  if (!db) {
    return c.json({ error: "Database is not available" }, 500);
  }

  const authHeader = c.req.header("Authorization");
  const user = await validateApiToken(db, authHeader);

  if (!user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  return c.json({
    userId: user.userId,
    username: user.username,
  });
});
