import type { SnippetDefinition } from "@tbsten/mir-registry-sdk";

export interface PublishPayload {
  definition: SnippetDefinition;
  files: Record<string, string>;
  force?: boolean;
}

export class PublishError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PublishError";
  }
}

/**
 * Bearer トークン認証チェック（環境変数ベース、移行期間のフォールバック用）
 */
export function validateAuthToken(
  authHeader: string | undefined,
  expectedToken: string | undefined,
): void {
  if (!expectedToken) {
    throw new PublishError(401, "Authentication is not configured");
  }

  if (!authHeader) {
    throw new PublishError(401, "Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new PublishError(401, "Invalid Authorization header format");
  }

  if (token !== expectedToken) {
    throw new PublishError(403, "Invalid API token");
  }
}

/**
 * Snippet を D1 に保存（owner_id 対応）
 */
export async function saveSnippetToD1(
  db: any,
  payload: PublishPayload,
  force: boolean = false,
  ownerId?: number,
): Promise<void> {
  const { definition, files } = payload;
  const { name } = definition;

  // 既存チェック
  const existing = await db
    .prepare("SELECT id, owner_id FROM snippets WHERE name = ?")
    .bind(name)
    .first();

  if (existing && !force) {
    throw new PublishError(409, `Snippet '${name}' already exists`);
  }

  // 所有権チェック: owner が設定されており、別ユーザーの場合は拒否
  if (existing && existing.owner_id && ownerId && existing.owner_id !== ownerId) {
    throw new PublishError(403, `Snippet '${name}' is owned by another user`);
  }

  if (existing && force) {
    // 既存の場合は削除（cascade で関連テーブルも削除）
    await db.prepare("DELETE FROM snippets WHERE name = ?").bind(name).run();
  }

  // snippet を挿入
  const snippetInsert = await db
    .prepare(
      `INSERT INTO snippets (name, version, description, tags, variables, dependencies, hooks, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    )
    .bind(
      name,
      definition.version || null,
      definition.description || null,
      definition.tags ? JSON.stringify(definition.tags) : null,
      definition.variables ? JSON.stringify(definition.variables) : null,
      definition.dependencies ? JSON.stringify(definition.dependencies) : null,
      definition.hooks ? JSON.stringify(definition.hooks) : null,
      ownerId || null,
    )
    .run();

  if (!snippetInsert.success) {
    throw new PublishError(500, `Failed to insert snippet: ${snippetInsert.error}`);
  }

  // 挿入された snippet の ID を取得
  const lastId = await db.prepare("SELECT last_insert_rowid() as id").first();
  const snippetId = (lastId as any)?.id;

  if (!snippetId) {
    throw new PublishError(500, "Failed to get snippet ID");
  }

  // ファイルを挿入
  for (const [filePath, content] of Object.entries(files)) {
    const fileInsert = await db
      .prepare(
        "INSERT INTO snippet_files (snippet_id, file_path, content) VALUES (?, ?, ?)",
      )
      .bind(snippetId, filePath, content)
      .run();

    if (!fileInsert.success) {
      throw new PublishError(500, `Failed to insert file '${filePath}': ${fileInsert.error}`);
    }
  }

  // バージョン履歴を追加
  if (definition.version) {
    const versionInsert = await db
      .prepare(
        `INSERT INTO snippet_versions (snippet_id, version, description, published_at)
         VALUES (?, ?, ?, datetime('now'))`,
      )
      .bind(snippetId, definition.version, definition.description || null)
      .run();

    if (!versionInsert.success) {
      throw new PublishError(500, `Failed to insert version: ${versionInsert.error}`);
    }
  }
}
