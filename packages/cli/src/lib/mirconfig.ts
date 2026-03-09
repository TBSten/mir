import fs from "node:fs";
import yaml from "js-yaml";
import { RegistryNotFoundError, RegistryRemoteError } from "@tbsten/mir-core";
import {
  expandTilde,
  globalConfigPath,
  localConfigPath,
  localPersonalConfigPath,
  defaultRegistryPath,
} from "./paths.js";

export interface RegistryEntry {
  name?: string;
  path?: string;
  url?: string;
  publish_token?: string;
}

export interface MirConfig {
  registries: RegistryEntry[];
  defaults?: Record<string, string>;
  locale?: "ja" | "en";
}

const DEFAULT_CONFIG: MirConfig = {
  registries: [
    {
      name: "official",
      url: "https://mir.tbsten.me",
    },
    { name: "default", path: "~/.mir/registry" },
  ],
};

export interface LoadMirConfigOptions {
  configPath?: string;
  cwd?: string;
}

export function loadMirConfig(opts?: LoadMirConfigOptions): MirConfig {
  if (opts?.configPath) {
    return loadSingleConfig(opts.configPath);
  }
  const cwd = opts?.cwd ?? process.cwd();
  const globalConf = loadSingleConfig(globalConfigPath());
  const localConf = loadOptionalConfig(localConfigPath(cwd));
  const localPersonalConf = loadOptionalConfig(localPersonalConfigPath(cwd));
  return mergeConfigs(localPersonalConf, mergeConfigs(localConf, globalConf));
}

const EMPTY_CONFIG: MirConfig = { registries: [] };

/**
 * オプショナルな config を読み込む。ファイルが存在しない場合は空 config を返す。
 * local / localPersonal config 用。DEFAULT_CONFIG でマージ結果を汚染しない。
 */
function loadOptionalConfig(filePath: string): MirConfig {
  if (!fs.existsSync(filePath)) {
    return { ...EMPTY_CONFIG };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = yaml.load(content) as Partial<MirConfig> | null;
  if (!parsed) {
    return { ...EMPTY_CONFIG };
  }
  return {
    registries: parsed.registries ?? [],
    defaults: parsed.defaults,
    locale: parsed.locale,
  };
}

export function loadSingleConfig(filePath: string): MirConfig {
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_CONFIG };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = yaml.load(content) as Partial<MirConfig> | null;
  if (!parsed) {
    return { ...DEFAULT_CONFIG };
  }
  return {
    registries: parsed.registries ?? DEFAULT_CONFIG.registries,
    defaults: parsed.defaults,
    locale: parsed.locale,
  };
}

export function mergeConfigs(
  local: MirConfig,
  global: MirConfig,
): MirConfig {
  const localRegistries = local.registries;
  const globalRegistries = global.registries;

  // ローカルの registries を先頭に、グローバルの registries を後方に
  // 同名の registry はローカルを優先（グローバル側を除外）
  const localNames = new Set(
    localRegistries.filter((r) => r.name).map((r) => r.name),
  );
  const mergedRegistries = [
    ...localRegistries,
    ...globalRegistries.filter((r) => !r.name || !localNames.has(r.name)),
  ];

  // defaults はローカルで上書き
  const mergedDefaults = {
    ...global.defaults,
    ...local.defaults,
  };

  return {
    registries: mergedRegistries,
    defaults: Object.keys(mergedDefaults).length > 0 ? mergedDefaults : undefined,
    locale: local.locale ?? global.locale,
  };
}

/**
 * registry エントリの URL から静的プロトコル URL を解決する。
 * サイト本体 URL (例: https://mir.tbsten.me) に /registry を付与。
 * 既に /registry が含まれている場合はそのまま返す。
 */
export function resolveRegistryUrl(entry: RegistryEntry): string {
  if (!entry.url) {
    throw new RegistryRemoteError(entry.name);
  }
  const url = entry.url.replace(/\/+$/, "");
  if (url.endsWith("/registry")) {
    return url;
  }
  return `${url}/registry`;
}

export function resolveRegistryPath(entry: RegistryEntry): string {
  if (!entry.path) {
    throw new RegistryRemoteError(entry.name);
  }
  return expandTilde(entry.path);
}

export function resolvePublishRegistry(
  config: MirConfig,
  registryName?: string,
): RegistryEntry {
  if (registryName) {
    const entry = config.registries.find((r) => r.name === registryName);
    if (!entry) {
      throw new RegistryNotFoundError(registryName);
    }
    // URL エントリの場合、publish_token がなければエラー
    if (entry.url && !entry.publish_token) {
      throw new RegistryRemoteError(registryName);
    }
    return entry;
  }

  // official registry（publish_token 付き）を優先
  const officialEntry = config.registries.find((r) => r.name === "official" && r.publish_token);
  if (officialEntry) {
    return officialEntry;
  }

  // publish_token ありの URL エントリがあればそれを使用
  const remoteEntry = config.registries.find((r) => r.url && r.publish_token);
  if (remoteEntry) {
    return remoteEntry;
  }

  // ローカルレジストリにフォールバック
  const localEntry = config.registries.find((r) => r.path);
  if (!localEntry) {
    throw new RegistryNotFoundError("(default)");
  }
  return localEntry;
}

export function resolveInstallRegistries(
  config: MirConfig,
  registryName?: string,
): RegistryEntry[] {
  if (registryName) {
    // URL 形式で直接指定された場合
    if (registryName.startsWith("http://") || registryName.startsWith("https://")) {
      return [{ url: registryName }];
    }
    // registry 名で指定された場合
    const entry = config.registries.find((r) => r.name === registryName);
    if (!entry) {
      throw new RegistryNotFoundError(registryName);
    }
    return [entry];
  }
  return config.registries;
}

export function ensureDefaultRegistryDir(): void {
  const registryDir = defaultRegistryPath();
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
}

/**
 * 指定 config ファイルの registry に publish_token を保存
 * @param targetConfigPath 省略時はグローバル config
 */
export function saveRegistryToken(
  registryName: string,
  token: string,
  targetConfigPath?: string,
): void {
  const configPath = targetConfigPath ?? globalConfigPath();
  const config = loadSingleConfig(configPath);

  const entry = config.registries.find((r) => r.name === registryName);
  if (entry) {
    entry.publish_token = token;
  } else {
    config.registries.push({ name: registryName, publish_token: token });
  }

  writeConfig(configPath, config);
}

/**
 * 指定 config ファイルの registry から publish_token を削除
 * @param targetConfigPath 省略時はグローバル config
 */
export function removeRegistryToken(
  registryName: string,
  targetConfigPath?: string,
): void {
  const configPath = targetConfigPath ?? globalConfigPath();
  const config = loadSingleConfig(configPath);

  const entry = config.registries.find((r) => r.name === registryName);
  if (entry) {
    delete entry.publish_token;
  }

  writeConfig(configPath, config);
}

export function writeConfig(configPath: string, config: MirConfig): void {
  const dir = configPath.replace(/\/[^/]+$/, "");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, yaml.dump(config), "utf-8");
}
