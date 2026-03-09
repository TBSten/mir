/**
 * POST /auth/logout
 * Cookie 削除でログアウト
 */
import { createRoute } from "honox/factory";

export default createRoute(async () => {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "mir_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  );
  headers.append("Location", "/");
  return new Response(null, { status: 302, headers });
});
