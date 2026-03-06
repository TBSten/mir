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

/** Network Error */
export class NetworkError extends AppError {
  constructor(
    public readonly url: string,
    cause?: string,
  ) {
    const message = cause
      ? `Failed to connect to ${url}: ${cause}`
      : `Failed to connect to ${url}`;
    super(message, 503);
    this.name = "NetworkError";
  }
}

/** Invalid Manifest Error */
export class InvalidManifestError extends AppError {
  constructor(
    public readonly url: string,
    cause?: string,
  ) {
    const message = cause
      ? `Invalid manifest at ${url}: ${cause}`
      : `Invalid manifest at ${url}`;
    super(message, 400);
    this.name = "InvalidManifestError";
  }
}

/** エラーレスポンスを生成 */
export function renderError(c: Context, error: AppError) {
  const isNetworkError = error instanceof NetworkError;
  const isInvalidManifest = error instanceof InvalidManifestError;

  return c.render(
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <p class="font-mono text-6xl font-bold text-sky-300">
        {error.statusCode}
      </p>
      <p class="font-mono text-lg text-sky-700">{`// ${error.message}`}</p>

      {isNetworkError && (
        <div class="text-center">
          <p class="font-mono text-xs text-sky-500 mb-2">
            Try again or check your network connection
          </p>
          <a href="/" class="font-mono text-sm text-sky-500 hover:underline">
            {"$ cd /"}
          </a>
        </div>
      )}

      {isInvalidManifest && (
        <div class="text-center">
          <p class="font-mono text-xs text-sky-500 mb-2">
            Check registry manifest format
          </p>
          <a
            href="/docs/api"
            class="font-mono text-sm text-sky-500 hover:underline block"
          >
            {"$ learn registry protocol"}
          </a>
          <a href="/" class="font-mono text-sm text-sky-500 hover:underline">
            {"$ cd /"}
          </a>
        </div>
      )}

      {!isNetworkError && !isInvalidManifest && (
        <a href="/" class="font-mono text-sm text-sky-500 hover:underline">
          {"$ cd /"}
        </a>
      )}
    </div>,
    { title: `${error.statusCode} - ${SITE_NAME}` },
  );
}
