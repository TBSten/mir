import type { RegistryProvider } from "@tbsten/mir-registry-sdk";

/**
 * Static provider - フォールバック用（D1 が空の場合は空を返す）
 * 実際のスニペットは D1 またはリモート registry から取得
 */
export const staticProvider: RegistryProvider = {
  async list() {
    return [];
  },
  async get() {
    return null;
  },
  async search() {
    return [];
  },
  async getVersionHistory() {
    return [];
  },
  async getDependencies() {
    return [];
  },
  async getTransitiveDependencies() {
    return [];
  },
};
