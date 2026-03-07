import type { Context } from "hono";
import type { RegistryProvider } from "@tbsten/mir-registry-sdk";
import { staticProvider } from "./provider.js";
import { createD1Provider } from "./d1-provider.js";

/**
 * リクエストコンテキストから適切なプロバイダーを取得
 * Dev 環境では staticProvider を使用
 * 本番環境では D1Provider を使用
 */
export function getProvider(c: Context): RegistryProvider {
  // Dev 環境では常に staticProvider を使用
  const isDev = (c.env as any)?.ENVIRONMENT === "development" || !((c.env as any)?.D1);
  if (isDev) {
    return staticProvider;
  }

  const db = (c.env as any)?.D1;
  if (db) {
    const d1Provider = createD1Provider(db);
    return createFallbackProvider(d1Provider, staticProvider);
  }
  return staticProvider;
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
        console.error("Primary provider list() failed, using fallback:", e);
        return await fallbackProvider.list();
      }
    },

    async get(name: string) {
      try {
        return await primaryProvider.get(name);
      } catch (e) {
        console.error(`Primary provider get(${name}) failed, using fallback:`, e);
        return await fallbackProvider.get(name);
      }
    },

    async search(query: string) {
      try {
        return await primaryProvider.search(query);
      } catch (e) {
        console.error(`Primary provider search(${query}) failed, using fallback:`, e);
        return await fallbackProvider.search(query);
      }
    },

    async getVersionHistory(name: string) {
      try {
        return await primaryProvider.getVersionHistory(name);
      } catch (e) {
        console.error(
          `Primary provider getVersionHistory(${name}) failed, using fallback:`,
          e,
        );
        return await fallbackProvider.getVersionHistory(name);
      }
    },

    async getDependencies(name: string) {
      try {
        return await primaryProvider.getDependencies(name);
      } catch (e) {
        console.error(
          `Primary provider getDependencies(${name}) failed, using fallback:`,
          e,
        );
        return await fallbackProvider.getDependencies(name);
      }
    },

    async getTransitiveDependencies(name: string) {
      try {
        return await primaryProvider.getTransitiveDependencies(name);
      } catch (e) {
        console.error(
          `Primary provider getTransitiveDependencies(${name}) failed, using fallback:`,
          e,
        );
        return await fallbackProvider.getTransitiveDependencies(name);
      }
    },
  };
}
