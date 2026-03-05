import type { Context } from "hono";
import { SITE_NAME } from "./constants.js";

/** アプリケーションエラーの基底クラス */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** 404 Not Found */
export class NotFoundError extends AppError {
  constructor(message = "Page not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/** エラーレスポンスを生成 */
export function renderError(c: Context, error: AppError) {
  return c.render(
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <p class="font-mono text-6xl font-bold text-sky-300">
        {error.statusCode}
      </p>
      <p class="font-mono text-lg text-sky-700">{`// ${error.message}`}</p>
      <a href="/" class="font-mono text-sm text-sky-500 hover:underline">
        {"$ cd /"}
      </a>
    </div>,
    { title: `${error.statusCode} - ${SITE_NAME}` },
  );
}
