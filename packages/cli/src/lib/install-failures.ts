import fs from "node:fs";
import path from "node:path";
import { installFailuresPath } from "./paths.js";

export interface FailedSnippetEntry {
  name: string;
  error: string;
  timestamp: number;
}

export interface InstallFailuresData {
  version: 1;
  entries: FailedSnippetEntry[];
}

export function loadInstallFailures(filePath?: string): FailedSnippetEntry[] {
  const fp = filePath ?? installFailuresPath();
  try {
    if (!fs.existsSync(fp)) {
      return [];
    }
    const content = fs.readFileSync(fp, "utf-8");
    const data = JSON.parse(content) as InstallFailuresData;
    if (data.version === 1) {
      return data.entries;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveInstallFailures(
  entries: FailedSnippetEntry[],
  filePath?: string,
): void {
  const fp = filePath ?? installFailuresPath();
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data: InstallFailuresData = {
    version: 1,
    entries,
  };
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
}

export function clearInstallFailures(filePath?: string): void {
  const fp = filePath ?? installFailuresPath();
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
  }
}

export function getFailedSnippetNames(filePath?: string): string[] {
  return loadInstallFailures(filePath).map((entry) => entry.name);
}
