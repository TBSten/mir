import type { Context } from "hono";
import type { RegistryProvider } from "@tbsten/mir-registry-sdk";
import { staticProvider } from "./provider.js";
import { createD1Provider } from "./d1-provider.js";

/**
 * リクエストコンテキストから適切なプロバイダーを取得
 * D1 が利用可能ならば D1Provider を、そうでなければ staticProvider を返す
 */
export function getProvider(c: Context): RegistryProvider {
  const db = (c.env as any)?.D1;
  if (db) {
    return createD1Provider(db);
  }
  return staticProvider;
}
