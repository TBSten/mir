import type {} from "hono";

type Bindings = {
  D1?: D1Database;
  // R2: R2Bucket;
  STATS_KV?: KVNamespace;
  PUBLISH_API_TOKEN?: string;
};

type RendererProps = {
  title?: string;
  description?: string;
  path?: string;
};

declare module "hono" {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: RendererProps,
    ): Response | Promise<Response>;
  }
  interface ContextVariableMap {
    // アプリケーション共通の変数があればここに定義
  }
  interface Env {
    Bindings: Bindings;
  }
}
