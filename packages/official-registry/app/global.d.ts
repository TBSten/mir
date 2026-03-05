import type {} from "hono";

type Bindings = {
  // D1: D1Database;
  // R2: R2Bucket;
};

type RendererProps = {
  title?: string;
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
