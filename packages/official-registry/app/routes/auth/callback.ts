/**
 * GET /auth/callback
 * GitHub OAuth コールバック: code→token 交換、ユーザー作成/更新
 * state が cli:{port} の場合は CLI 用トークン発行 → localhost リダイレクト
 */
import { createRoute } from "honox/factory";
import {
  exchangeCodeForToken,
  fetchGitHubUser,
  upsertUser,
  createJwt,
  generateApiToken,
  sha256,
} from "../../lib/auth.js";

export default createRoute(async (c) => {
  const code = c.req.query("code");
  const stateParam = c.req.query("state");

  if (!code) {
    return c.json({ error: "Missing 'code' parameter" }, 400);
  }

  const clientId = (c.env as any)?.GITHUB_CLIENT_ID;
  const clientSecret = (c.env as any)?.GITHUB_CLIENT_SECRET;
  const authSecret = (c.env as any)?.AUTH_SECRET;
  const db = (c.env as any)?.D1 as D1Database | undefined;

  if (!clientId || !clientSecret || !authSecret) {
    return c.json({ error: "OAuth is not configured" }, 500);
  }
  if (!db) {
    return c.json({ error: "Database is not available" }, 500);
  }

  try {
    const accessToken = await exchangeCodeForToken(code, clientId, clientSecret);
    const githubUser = await fetchGitHubUser(accessToken);
    const userId = await upsertUser(db, githubUser);

    // state をデコード
    let stateValue = "web";
    if (stateParam) {
      try {
        stateValue = atob(stateParam);
      } catch {
        // invalid base64, default to web
      }
    }

    // CLI フロー: API token 発行 → localhost にリダイレクト
    if (stateValue.startsWith("cli:")) {
      const port = stateValue.slice(4);
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
    }

    // Web フロー: JWT Cookie をセット
    const jwt = await createJwt(userId, githubUser.login, authSecret);
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `mir_session=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    );
    headers.append("Location", "/");
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "OAuth failed" },
      500,
    );
  }
});
