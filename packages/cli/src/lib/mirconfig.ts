import fs from "node:fs";
import yaml from "js-yaml";
import { RegistryNotFoundError, RegistryRemoteError } from "@mir/core";
import {
  expandTilde,
  globalConfigPath,
  localConfigPath,
  defaultRegistryPath,
} from "./paths.js";

export interface RegistryEntry {
  name?: string;
  path?: string;
  url?: string;
}

export interface MirConfig {
  registries: RegistryEntry[];
  defaults?: Record<string, string>;
  locale?: "ja" | "en";
}

const DEFAULT_CONFIG: MirConfig = {
  registries: [{ path: "~/.mir/registry" }],
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
  const localConf = loadSingleConfig(localConfigPath(cwd));
  return mergeConfigs(localConf, globalConf);
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
    if (entry.url) {
      throw new RegistryRemoteError(registryName);
    }
    return entry;
  }

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
