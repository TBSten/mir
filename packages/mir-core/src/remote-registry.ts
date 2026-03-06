import { RemoteRegistryFetchError, InvalidManifestError } from "./errors.js";
import { parseSnippetYaml } from "./snippet-schema.js";
import { expandTemplate, expandPath } from "./template-engine.js";
import type { SnippetDefinition } from "./snippet-schema.js";

/**
 * リモート registry のマニフェスト (index.json) の型
 */
export interface RegistryManifest {
  snippets: Record<string, { files: string[] }>;
}

/**
 * リモートから取得した snippet の情報
 */
export interface RemoteSnippet {
  definition: SnippetDefinition;
  files: Map<string, string>;
}

/**
 * キャッシュエントリの型
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60000; // 60秒
const manifestCache = new Map<string, CacheEntry<RegistryManifest>>();
const snippetListCache = new Map<string, CacheEntry<string[]>>();

/**
 * キャッシュが有効か確認
 */
function isCacheValid<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * すべてのリモート registry キャッシュをクリア
 */
export function clearAllRemoteRegistryCaches(): void {
  manifestCache.clear();
  snippetListCache.clear();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * マニフェスト (index.json) を取得する（キャッシュ付き）
 */
export async function fetchRegistryManifest(
  baseUrl: string,
): Promise<RegistryManifest> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  const cached = manifestCache.get(normalizedUrl);

  if (cached && isCacheValid(cached)) {
    return cached.data;
  }

  const url = `${normalizedUrl}/index.json`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new RemoteRegistryFetchError(url);
  }
  if (!res.ok) {
    throw new RemoteRegistryFetchError(url, res.status);
  }
  const data: unknown = await res.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("snippets" in data) ||
    typeof (data as RegistryManifest).snippets !== "object"
  ) {
    throw new InvalidManifestError(url);
  }

  const manifest = data as RegistryManifest;
  manifestCache.set(normalizedUrl, {
    data: manifest,
    timestamp: Date.now(),
  });

  return manifest;
}

/**
 * リモート registry の snippet 名一覧を返す（キャッシュ付き）
 */
export async function listRemoteSnippets(
  baseUrl: string,
): Promise<string[]> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  const cached = snippetListCache.get(normalizedUrl);

  if (cached && isCacheValid(cached)) {
    return cached.data;
  }

  const manifest = await fetchRegistryManifest(baseUrl);
  const snippetList = Object.keys(manifest.snippets);

  snippetListCache.set(normalizedUrl, {
    data: snippetList,
    timestamp: Date.now(),
  });

  return snippetList;
}

/**
 * snippet 定義 (YAML) を取得する
 */
export async function fetchSnippetDefinition(
  baseUrl: string,
  name: string,
): Promise<SnippetDefinition> {
  const url = `${normalizeBaseUrl(baseUrl)}/${name}.yaml`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new RemoteRegistryFetchError(url);
  }
  if (!res.ok) {
    throw new RemoteRegistryFetchError(url, res.status);
  }
  const text = await res.text();
  return parseSnippetYaml(text);
}

/**
 * テンプレートファイル群を並列で取得する
 */
export async function fetchRemoteFiles(
  baseUrl: string,
  name: string,
  files: string[],
): Promise<Map<string, string>> {
  const base = normalizeBaseUrl(baseUrl);
  const result = new Map<string, string>();

  const entries = await Promise.all(
    files.map(async (filePath) => {
      const url = `${base}/${name}/${encodeURIComponent(filePath)}`;
      let res: Response;
      try {
        res = await fetch(url);
      } catch {
        throw new RemoteRegistryFetchError(url);
      }
      if (!res.ok) {
        throw new RemoteRegistryFetchError(url, res.status);
      }
      const content = await res.text();
      return [filePath, content] as const;
    }),
  );

  for (const [filePath, content] of entries) {
    result.set(filePath, content);
  }
  return result;
}

/**
 * snippet 定義とテンプレートファイルを統合して取得する
 */
export async function fetchRemoteSnippet(
  baseUrl: string,
  name: string,
): Promise<RemoteSnippet> {
  const manifest = await fetchRegistryManifest(baseUrl);
  const snippetEntry = manifest.snippets[name];
  if (!snippetEntry) {
    throw new RemoteRegistryFetchError(
      `${normalizeBaseUrl(baseUrl)}/${name}.yaml`,
      404,
    );
  }

  const [definition, files] = await Promise.all([
    fetchSnippetDefinition(baseUrl, name),
    fetchRemoteFiles(baseUrl, name, snippetEntry.files),
  ]);

  return { definition, files };
}

/**
 * リモートから取得したテンプレートファイルの変数を展開する
 */
export function expandRemoteTemplateFiles(
  files: Map<string, string>,
  variables: Record<string, unknown>,
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [filePath, content] of files) {
    const expandedPath = expandPath(filePath, variables);
    const expandedContent = expandTemplate(content, variables);
    result.set(expandedPath, expandedContent);
  }
  return result;
}
