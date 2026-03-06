/**
 * KV ストアでインストール統計を管理するユーティリティ
 */

export interface InstallStats {
  name: string;
  count: number;
  lastUpdated: number;
}

const KV_PREFIX = "stats:";

export async function incrementInstallCount(
  kv: KVNamespace,
  snippetName: string,
): Promise<number> {
  const key = `${KV_PREFIX}${snippetName}`;
  const current = await kv.get(key, "json");
  const newCount = ((current as InstallStats | null)?.count ?? 0) + 1;

  const stats: InstallStats = {
    name: snippetName,
    count: newCount,
    lastUpdated: Date.now(),
  };

  await kv.put(key, JSON.stringify(stats));
  return newCount;
}

export async function getInstallCount(
  kv: KVNamespace,
  snippetName: string,
): Promise<number> {
  const key = `${KV_PREFIX}${snippetName}`;
  const stats = await kv.get(key, "json");
  return ((stats as InstallStats | null)?.count ?? 0);
}

export async function getAllInstallStats(
  kv: KVNamespace,
): Promise<InstallStats[]> {
  const list = await kv.list({ prefix: KV_PREFIX });
  const stats: InstallStats[] = [];

  for (const item of list.keys) {
    const data = await kv.get(item.name, "json");
    if (data) {
      stats.push(data as InstallStats);
    }
  }

  return stats.sort((a, b) => b.count - a.count);
}
