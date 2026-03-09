import type { Context } from "hono";
import type { RegistryProvider } from "@tbsten/mir-registry-sdk";
import { staticProvider } from "./provider.js";
import { createD1Provider } from "./d1-provider.js";
import { createInMemoryProvider } from "./in-memory-store.js";

// dev 環境用のモジュールレベル InMemory プロバイダー（プロセス内で持続）
const devProvider = createInMemoryProvider();

/**
 * リクエストコンテキストから適切なプロバイダーを取得
 * Dev 環境では InMemory を使用（プロセス内でデータが持続）
 * 本番環境では D1Provider を使用（フォールバック付き）
 */
export function getProvider(c: Context): RegistryProvider {
  // Dev 環境では常に InMemory を使用
  const isDev =
    process.env.DEV_MODE === "true" ||
    process.env.NODE_ENV === "development" ||
    typeof (c.env as any)?.D1 === "undefined";
  if (isDev) {
    return devProvider;
  }

  const db = (c.env as any)?.D1;
  if (db) {
    const d1Provider = createD1Provider(db);
    return createFallbackProvider(d1Provider, staticProvider);
  }
  return staticProvider;
}

/**
 * dev 環境用プロバイダーを取得（テスト・デバッグ用）
 */
export function getDevProvider(): RegistryProvider {
  return devProvider;
}

/**
 * プライマリプロバイダーが失敗した場合、フォールバックプロバイダーを使用する
 */
function createFallbackProvider(
  primaryProvider: RegistryProvider,
  fallbackProvider: RegistryProvider,
): RegistryProvider {
  return {
    async list() {
      try {
        const result = await primaryProvider.list();
        // D1 から結果を取得した場合、それを使用する
        if (result && result.length > 0) {
          return result;
        }
        // 空の配列の場合もフォールバック
        return await fallbackProvider.list();
      } catch (e) {
        return await fallbackProvider.list();
      }
    },

    async get(name: string) {
      try {
        return await primaryProvider.get(name);
      } catch (e) {
        return await fallbackProvider.get(name);
      }
    },

    async search(query: string) {
      try {
        return await primaryProvider.search!(query);
      } catch (e) {
        return await fallbackProvider.search!(query);
      }
    },

    async getVersionHistory(name: string) {
      try {
        return await primaryProvider.getVersionHistory!(name);
      } catch (e) {
        return await fallbackProvider.getVersionHistory!(name);
      }
    },

    async getDependencies(name: string) {
      try {
        return await primaryProvider.getDependencies!(name);
      } catch (e) {
        return await fallbackProvider.getDependencies!(name);
      }
    },

    async getTransitiveDependencies(name: string) {
      try {
        return await primaryProvider.getTransitiveDependencies!(name);
      } catch (e) {
        return await fallbackProvider.getTransitiveDependencies!(name);
      }
    },
  };
}
