/**
 * 環境変数から CLI 設定を読み込む
 * MIR_* 環境変数を統一的に取得する関数を集約
 */

export type Locale = "ja" | "en";

/**
 * MIR_REGISTRY 環境変数を取得
 */
export function getRegistryFromEnv(): string | undefined {
  return process.env.MIR_REGISTRY;
}

/**
 * MIR_LOCALE 環境変数を取得 ('ja' | 'en' のみ有効)
 */
export function getLocaleFromEnv(): Locale | undefined {
  const locale = process.env.MIR_LOCALE;
  if (locale === "ja" || locale === "en") {
    return locale;
  }
  return undefined;
}

/**
 * MIR_CONFIG 環境変数を取得 (設定ファイルパス)
 */
export function getConfigPathFromEnv(): string | undefined {
  return process.env.MIR_CONFIG;
}

/**
 * MIR_OUT_DIR 環境変数を取得 (出力ディレクトリ)
 */
export function getOutDirFromEnv(): string | undefined {
  return process.env.MIR_OUT_DIR;
}

/**
 * MIR_NO_INTERACTIVE 環境変数を取得 (非対話モード)
 * "true", "1" で true、その他で false
 */
export function getNoInteractiveFromEnv(): boolean {
  const value = process.env.MIR_NO_INTERACTIVE;
  if (!value) {
    return false;
  }
  return value === "true" || value === "1";
}
