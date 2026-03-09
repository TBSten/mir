/**
 * 認証ヘルパー: JWT, GitHub OAuth, トークン生成/検証
 */

// --- JWT (hono/jwt 使用) ---

import { sign, verify } from "hono/jwt";

export interface JwtPayload {
  sub: number; // userId
  username: string;
  iat: number;
  exp: number;
}

export async function createJwt(
  userId: number,
  username: string,
  secret: string,
  expiresInSec = 60 * 60 * 24 * 7, // 7 日
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: userId, username, iat: now, exp: now + expiresInSec },
    secret,
  );
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  try {
    const payload = await verify(token, secret, "HS256");
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// --- GitHub OAuth ---

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error || "Failed to exchange code for token");
  }
  return data.access_token;
}

export async function fetchGitHubUser(
  accessToken: string,
): Promise<GitHubUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch GitHub user");
  }
  return res.json() as Promise<GitHubUser>;
}

// --- トークン生成/ハッシュ ---

export function generateApiToken(): string {
  return `mir_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- DB ベース API トークン検証 ---

export interface ValidatedTokenUser {
  userId: number;
  username: string;
  tokenId: number;
}

export async function validateApiToken(
  db: D1Database,
  authHeader: string | undefined,
): Promise<ValidatedTokenUser | null> {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  const tokenHash = await sha256(token);
  const row = await db
    .prepare(
      `SELECT t.id as token_id, t.user_id, u.github_login
       FROM api_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ?
       AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))`,
    )
    .bind(tokenHash)
    .first<{ token_id: number; user_id: number; github_login: string }>();

  if (!row) return null;

  // last_used を更新
  await db
    .prepare("UPDATE api_tokens SET last_used = datetime('now') WHERE id = ?")
    .bind(row.token_id)
    .run();

  return {
    userId: row.user_id,
    username: row.github_login,
    tokenId: row.token_id,
  };
}

// --- DB ユーザー upsert ---

export async function upsertUser(
  db: D1Database,
  githubUser: GitHubUser,
): Promise<number> {
  const existing = await db
    .prepare("SELECT id FROM users WHERE github_id = ?")
    .bind(githubUser.id)
    .first<{ id: number }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE users SET github_login = ?, display_name = ?, avatar_url = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(githubUser.login, githubUser.name, githubUser.avatar_url, existing.id)
      .run();
    return existing.id;
  }

  const result = await db
    .prepare(
      `INSERT INTO users (github_id, github_login, display_name, avatar_url)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(githubUser.id, githubUser.login, githubUser.name, githubUser.avatar_url)
    .run();

  const lastId = await db.prepare("SELECT last_insert_rowid() as id").first<{ id: number }>();
  return lastId!.id;
}
