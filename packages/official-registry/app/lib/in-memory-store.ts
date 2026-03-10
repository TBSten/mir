import type {
  RegistryProvider,
  RegistrySnippetDetail,
  RegistrySnippetSummary,
  SnippetVersionEntry,
} from "@tbsten/mir-registry-sdk";

/**
 * dev 環境用のメモリ内 Registry Store
 * Node.js プロセス内でデータを持続する
 */
const store = new Map<string, RegistrySnippetDetail>();

export function createInMemoryProvider(): RegistryProvider {
  return {
    async list(): Promise<RegistrySnippetSummary[]> {
      return Array.from(store.values()).map((detail) => ({
        name: detail.definition.name,
        description: detail.definition.description || "",
        version: detail.definition.version,
      }));
    },

    async get(name: string): Promise<RegistrySnippetDetail | null> {
      return store.get(name) || null;
    },

    async getVersionHistory(name: string): Promise<SnippetVersionEntry[] | null> {
      const detail = store.get(name);
      if (!detail) return null;
      const version = detail.definition.version;
      return version ? [{ version }] : [];
    },

    async getDependencies(name: string): Promise<string[]> {
      const detail = store.get(name);
      return detail?.definition.dependencies || [];
    },

    async getTransitiveDependencies(name: string): Promise<string[]> {
      // 簡易実装: 直接の依存関係のみを返す
      const detail = store.get(name);
      return detail?.definition.dependencies || [];
    },
  };
}

/**
 * InMemory ストアにスニペットを保存
 * @param detail - 保存するスニペット詳細
 * @param force - 既存データを上書きするかどうか
 */
export function saveToInMemoryStore(
  detail: RegistrySnippetDetail,
  force: boolean = false
): void {
  const name = detail.definition.name;

  if (store.has(name) && !force) {
    throw new Error(`Snippet "${name}" already exists. Use force=true to overwrite.`);
  }

  store.set(name, detail);
}

/**
 * InMemory ストアをクリア（テスト用）
 */
export function clearInMemoryStore(): void {
  store.clear();
}

/**
 * InMemory ストアの内容を取得（デバッグ用）
 */
export function getInMemoryStoreContents(): Map<string, RegistrySnippetDetail> {
  return new Map(store);
}
