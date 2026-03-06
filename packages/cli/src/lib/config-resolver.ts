/**
 * CLI 設定の優先順位解決
 * CLI option > 環境変数 > config file > default
 */

import { globalConfigPath } from "./paths.js";
import type { MirConfig } from "./mirconfig.js";
import type { Locale } from "./env.js";

export interface ResolvedConfig {
  registry?: string;
  locale: Locale;
  configPath: string;
  interactive: boolean;
  outDir?: string;
  defaults?: Record<string, string>;
}

let cachedConfig: ResolvedConfig | null = null;

/**
 * 設定を解決（優先順位: CLI > ENV > config > default）
 * @param cliOptions CLI オプション (commander から渡される)
 * @param envVars 環境変数 (process.env を渡すか、テスト用の辞書)
 * @param config MirConfig (loadMirConfig の結果)
 */
export function resolveConfig(
  cliOptions: Record<string, unknown> = {},
  envVars: Record<string, string> = {},
  config: Partial<MirConfig> = {},
): ResolvedConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // registry の解決: CLI > ENV > config
  let registry: string | undefined;
  if (cliOptions.registry) {
    registry = cliOptions.registry as string;
  } else if (envVars.MIR_REGISTRY) {
    registry = envVars.MIR_REGISTRY;
  } else if (config.registries && config.registries.length > 0) {
    const firstRegistry = config.registries[0];
    if (firstRegistry.name) {
      registry = firstRegistry.name;
    }
  }

  // locale の解決: CLI > ENV > config > default('en')
  let locale: Locale = "en";
  if (cliOptions.locale) {
    const cliLocale = cliOptions.locale as string;
    if (cliLocale === "ja" || cliLocale === "en") {
      locale = cliLocale;
    }
  } else if (envVars.MIR_LOCALE) {
    const envLocale = envVars.MIR_LOCALE;
    if (envLocale === "ja" || envLocale === "en") {
      locale = envLocale;
    }
  } else if (config.locale) {
    locale = config.locale;
  }

  // configPath の解決: CLI > ENV > default
  let configPath: string;
  if (cliOptions.config) {
    configPath = cliOptions.config as string;
  } else if (envVars.MIR_CONFIG) {
    configPath = envVars.MIR_CONFIG;
  } else {
    configPath = globalConfigPath();
  }

  // interactive の解決: CLI > ENV > default(true)
  let interactive = true;
  if (typeof cliOptions.interactive === "boolean") {
    interactive = cliOptions.interactive;
  } else if (envVars.MIR_NO_INTERACTIVE) {
    interactive = envVars.MIR_NO_INTERACTIVE !== "true" && envVars.MIR_NO_INTERACTIVE !== "1";
  }

  // outDir の解決: CLI > ENV
  let outDir: string | undefined;
  if (cliOptions.outDir) {
    outDir = cliOptions.outDir as string;
  } else if (envVars.MIR_OUT_DIR) {
    outDir = envVars.MIR_OUT_DIR;
  }

  cachedConfig = {
    registry,
    locale,
    configPath,
    interactive,
    outDir,
    defaults: config.defaults,
  };

  return cachedConfig;
}

/**
 * キャッシュをクリア (テスト用)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
