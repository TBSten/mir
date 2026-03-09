import type { SnippetDefinition } from "@tbsten/mir-core";

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
  /** snippet が直接依存する snippet 名の一覧を返す。実装は任意 */
  getDependencies?(name: string): Promise<string[]>;
  /** snippet が依存する全ての snippet 名（推移的依存関係を含む）を返す。実装は任意 */
  getTransitiveDependencies?(name: string): Promise<string[]>;
}

/** publish 可能な registry プロバイダ */
export interface PublishableRegistryProvider extends RegistryProvider {
  publish(detail: RegistrySnippetDetail, force?: boolean, ownerId?: number): Promise<void>;
}

/** 認証コンテキスト */
export interface AuthContext {
  userId: number;
  username: string;
}

/** 認証設定（カスタム registry 用） */
export interface AuthConfig {
  authenticate: (req: Request) => Promise<AuthContext | null>;
}

/** createRegistryRoutes のオプション */
export interface RegistryRoutesOptions {
  auth?: AuthConfig;
  publisher?: PublishableRegistryProvider;
}
