/**
 * GET /auth/login
 * GitHub OAuth 開始: state 生成 → GitHub へリダイレクト
 * cli=true&callback_port={port} で CLI からのフローに対応
 */
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const clientId = (c.env as any)?.GITHUB_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: "GITHUB_CLIENT_ID is not configured" }, 500);
  }

  const isCli = c.req.query("cli") === "true";
  const callbackPort = c.req.query("callback_port");

  // state に CLI 情報をエンコード
  const statePayload = isCli && callbackPort
    ? `cli:${callbackPort}`
    : "web";
  const state = btoa(statePayload);

  const redirectUri = new URL("/auth/callback", c.req.url).toString();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
    state,
  });

  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});
