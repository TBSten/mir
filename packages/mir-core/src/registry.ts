import fs from "node:fs";
import path from "node:path";
import { parseSnippetYaml, type SnippetDefinition } from "./snippet-schema.js";

export function listRegistrySnippets(registryPath: string): string[] {
  if (!fs.existsSync(registryPath)) {
    return [];
  }
  const entries = fs.readdirSync(registryPath);
  return entries
    .filter((e) => e.endsWith(".yaml"))
    .map((e) => e.replace(/\.yaml$/, ""));
}

export function snippetExistsInRegistry(
  registryPath: string,
  name: string,
): boolean {
  const yamlPath = path.join(registryPath, `${name}.yaml`);
  return fs.existsSync(yamlPath);
}

export function readSnippetFromRegistry(
  registryPath: string,
  name: string,
): SnippetDefinition {
  const yamlPath = path.join(registryPath, `${name}.yaml`);
  const content = fs.readFileSync(yamlPath, "utf-8");
  return parseSnippetYaml(content);
}

export function listTemplateFiles(
  registryPath: string,
  name: string,
): string[] {
  const dirPath = path.join(registryPath, name);
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return listFilesRecursive(dirPath, "");
}

const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

function listFilesRecursive(basePath: string, relativePath: string): string[] {
  const fullPath = relativePath
    ? path.join(basePath, relativePath)
    : basePath;
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (IGNORED_FILES.has(entry.name)) continue;
    const entryRelative = relativePath
      ? path.join(relativePath, entry.name)
      : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(basePath, entryRelative));
    } else {
      files.push(entryRelative);
    }
  }

  return files;
}

export function readTemplateFile(
  registryPath: string,
  name: string,
  filePath: string,
): string {
  const fullPath = path.join(registryPath, name, filePath);
  return fs.readFileSync(fullPath, "utf-8");
}

export function copySnippetToRegistry(
  sourceDir: string,
  sourceYamlPath: string,
  registryPath: string,
  name: string,
): void {
  fs.mkdirSync(registryPath, { recursive: true });

  const destYaml = path.join(registryPath, `${name}.yaml`);
  fs.copyFileSync(sourceYamlPath, destYaml);

  const destDir = path.join(registryPath, name);
  copyDirectoryRecursive(sourceDir, destDir);
}

function copyDirectoryRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function removeSnippetFromRegistry(
  registryPath: string,
  name: string,
): void {
  const yamlPath = path.join(registryPath, `${name}.yaml`);
  if (fs.existsSync(yamlPath)) {
    fs.unlinkSync(yamlPath);
  }

  const dirPath = path.join(registryPath, name);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}
