import type { SnippetDefinition } from "@mir/core";

/** snippet のメタ情報 (一覧用) */
export interface RegistrySnippetSummary {
  name: string;
  version?: string;
  description?: string;
}

/** snippet の詳細 (インストール用) */
export interface RegistrySnippetDetail {
  definition: SnippetDefinition;
  files: Map<string, string>;
}

/** バージョン履歴のエントリ */
export interface SnippetVersionEntry {
  version: string;
  publishedAt?: string;
  description?: string;
}

/** registry プロバイダが実装するインタフェース */
export interface RegistryProvider {
  list(): Promise<RegistrySnippetSummary[]>;
  get(name: string): Promise<RegistrySnippetDetail | null>;
  search?(query: string): Promise<RegistrySnippetSummary[]>;
  /** snippet のバージョン履歴を返す。実装は任意 */
  getVersionHistory?(name: string): Promise<SnippetVersionEntry[] | null>;
}
