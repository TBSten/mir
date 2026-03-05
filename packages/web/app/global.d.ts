import type {} from "hono";

type Bindings = {
  // D1: D1Database;
  // R2: R2Bucket;
};

declare module "hono" {
  interface ContextVariableMap {
    // アプリケーション共通の変数があればここに定義
  }
  interface Env {
    Bindings: Bindings;
  }
}
