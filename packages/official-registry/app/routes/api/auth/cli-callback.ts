/**
 * GET /api/auth/cli-callback
 * CLI 用: GitHub code → token 発行 → localhost にリダイレクト
 */
import { createRoute } from "honox/factory";
import {
  exchangeCodeForToken,
  fetchGitHubUser,
  upsertUser,
  generateApiToken,
  sha256,
} from "../../../lib/auth.js";

export default createRoute(async (c) => {
  const code = c.req.query("code");
  const port = c.req.query("port");

  if (!code || !port) {
    return c.json({ error: "Missing 'code' or 'port' parameter" }, 400);
  }

  const clientId = (c.env as any)?.GITHUB_CLIENT_ID;
  const clientSecret = (c.env as any)?.GITHUB_CLIENT_SECRET;
  const db = (c.env as any)?.D1 as D1Database | undefined;

  if (!clientId || !clientSecret) {
    return c.json({ error: "OAuth is not configured" }, 500);
  }
  if (!db) {
    return c.json({ error: "Database is not available" }, 500);
  }

  try {
    const accessToken = await exchangeCodeForToken(code, clientId, clientSecret);
    const githubUser = await fetchGitHubUser(accessToken);
    const userId = await upsertUser(db, githubUser);

    const token = generateApiToken();
    const tokenHash = await sha256(token);

    await db
      .prepare(
        "INSERT INTO api_tokens (user_id, token_hash, name) VALUES (?, ?, ?)",
      )
      .bind(userId, tokenHash, `CLI (auto-generated)`)
      .run();

    return c.redirect(
      `http://localhost:${port}/callback?token=${encodeURIComponent(token)}&username=${encodeURIComponent(githubUser.login)}`,
    );
  } catch (error) {
    console.error("CLI callback error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      500,
    );
  }
});
