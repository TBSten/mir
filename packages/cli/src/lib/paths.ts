import path from "node:path";
import os from "node:os";

export function expandTilde(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

export function snippetsBasePath(cwd: string): string {
  return path.join(cwd, ".mir", "snippets");
}

export function snippetYamlPath(cwd: string, name: string): string {
  return path.join(snippetsBasePath(cwd), `${name}.yaml`);
}

export function snippetDirPath(cwd: string, name: string): string {
  return path.join(snippetsBasePath(cwd), name);
}

export function globalConfigPath(): string {
  return expandTilde("~/.mir/config.yaml");
}

export function localConfigPath(cwd: string): string {
  return path.join(cwd, ".mir", "config.yaml");
}

/** @deprecated Use globalConfigPath() instead */
export function mirconfigPath(): string {
  return globalConfigPath();
}

export function defaultRegistryPath(): string {
  return expandTilde("~/.mir/registry");
}

export function installFailuresPath(): string {
  return expandTilde("~/.mir/install-failures.json");
}
