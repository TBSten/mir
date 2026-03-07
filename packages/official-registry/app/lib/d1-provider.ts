import type {
  RegistryProvider,
  RegistrySnippetDetail,
  RegistrySnippetSummary,
  SnippetVersionEntry,
} from "@tbsten/mir-registry-sdk";

export function createD1Provider(db: D1Database): RegistryProvider {
  return {
    async list(): Promise<RegistrySnippetSummary[]> {
      try {
        const result = await db
          .prepare("SELECT name, version, description FROM snippets ORDER BY name")
          .all();

        if (!result.success) {
          return [];
        }

        return (result.results || []).map((row: any) => ({
          name: row.name,
          version: row.version || undefined,
          description: row.description || undefined,
        }));
      } catch (e) {
        // Silently fall back to empty list on D1 error (e.g., in dev environment)
        return [];
      }
    },

    async get(name: string): Promise<RegistrySnippetDetail | null> {
      try {
        const snippetResult = await db
          .prepare("SELECT * FROM snippets WHERE name = ?")
          .bind(name)
          .first();

        if (!snippetResult) {
          return null;
        }

        const filesResult = await db
          .prepare("SELECT file_path, content FROM snippet_files WHERE snippet_id = ?")
          .bind(snippetResult.id)
          .all();

        const files = new Map<string, string>();
        if (filesResult.success && filesResult.results) {
          for (const row of filesResult.results as any[]) {
            files.set(row.file_path, row.content);
          }
        }

        return {
          definition: {
            name: String(snippetResult.name),
            version: snippetResult.version ? String(snippetResult.version) : undefined,
            description: snippetResult.description ? String(snippetResult.description) : undefined,
            tags: snippetResult.tags ? JSON.parse(String(snippetResult.tags)) : undefined,
            variables: snippetResult.variables
              ? JSON.parse(String(snippetResult.variables))
              : undefined,
            dependencies: snippetResult.dependencies
              ? JSON.parse(String(snippetResult.dependencies))
              : undefined,
            hooks: snippetResult.hooks ? JSON.parse(String(snippetResult.hooks)) : undefined,
          },
          files,
        };
      } catch (e) {
        
        return null;
      }
    },

    async search(query: string): Promise<RegistrySnippetSummary[]> {
      try {
        const searchQuery = `%${query}%`;
        const result = await db
          .prepare(
            `SELECT name, version, description FROM snippets
             WHERE name LIKE ? OR description LIKE ?
             ORDER BY name`,
          )
          .bind(searchQuery, searchQuery)
          .all();

        if (!result.success) {
          return [];
        }

        return (result.results || []).map((row: any) => ({
          name: row.name,
          version: row.version || undefined,
          description: row.description || undefined,
        }));
      } catch (e) {
        
        return [];
      }
    },

    async getVersionHistory(name: string): Promise<SnippetVersionEntry[]> {
      try {
        const snippetResult = await db
          .prepare("SELECT id FROM snippets WHERE name = ?")
          .bind(name)
          .first();

        if (!snippetResult) {
          return [];
        }

        const result = await db
          .prepare(
            `SELECT version, description, published_at FROM snippet_versions
             WHERE snippet_id = ?
             ORDER BY published_at DESC`,
          )
          .bind(snippetResult.id)
          .all();

        if (!result.success) {
          return [];
        }

        return (result.results || []).map((row: any) => ({
          version: row.version,
          publishedAt: row.published_at || new Date().toISOString(),
          description: row.description || undefined,
        }));
      } catch (e) {
        
        return [];
      }
    },

    async getDependencies(name: string): Promise<string[]> {
      try {
        const result = await db
          .prepare("SELECT dependencies FROM snippets WHERE name = ?")
          .bind(name)
          .first();

        if (!result || !result.dependencies) {
          return [];
        }

        try {
          return JSON.parse(String(result.dependencies)) || [];
        } catch {
          return [];
        }
      } catch (e) {
        
        return [];
      }
    },

    async getTransitiveDependencies(name: string): Promise<string[]> {
      const visited = new Set<string>();
      const queue: string[] = [name];
      const provider = this;

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const deps = await provider.getDependencies(current);
        for (const dep of deps) {
          if (!visited.has(dep)) {
            queue.push(dep);
          }
        }
      }

      // 自分自身を除いた結果を返す
      visited.delete(name);
      return Array.from(visited);
    },
  };
}
