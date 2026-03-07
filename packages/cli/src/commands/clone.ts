import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import {
  validateSnippetName,
  serializeSnippetYaml,
  SnippetAlreadyExistsError,
  SnippetNotFoundError,
  t,
  type SnippetDefinition,
} from "@tbsten/mir-core";
import { snippetYamlPath, snippetDirPath, snippetsBasePath } from "../lib/paths.js";
import * as logger from "../lib/logger.js";

export interface CloneOptions {
  alias?: string;
  force?: boolean;
}

function generateCloneName(originalName: string): string {
  // originalName-copy, originalName-copy2, ... という形式を生成
  return `${originalName}-copy`;
}

export function cloneSnippet(
  name: string,
  opts: CloneOptions = {},
  cwd: string = process.cwd(),
): void {
  validateSnippetName(name);

  const sourceYamlPath = snippetYamlPath(cwd, name);
  if (!fs.existsSync(sourceYamlPath)) {
    throw new SnippetNotFoundError(name);
  }

  const sourceDirPath = snippetDirPath(cwd, name);

  // クローン先の名前を決定
  const cloneName = opts.alias || generateCloneName(name);
  validateSnippetName(cloneName);

  const targetYamlPath = snippetYamlPath(cwd, cloneName);
  const targetDirPath = snippetDirPath(cwd, cloneName);

  if (fs.existsSync(targetYamlPath)) {
    if (!opts.force) {
      throw new SnippetAlreadyExistsError(cloneName);
    }
    // --force の場合は既存のものを削除
    fs.rmSync(targetYamlPath, { force: true });
    if (fs.existsSync(targetDirPath)) {
      fs.rmSync(targetDirPath, { recursive: true, force: true });
    }
  }

  // ベースディレクトリを作成
  const basePath = snippetsBasePath(cwd);
  fs.mkdirSync(basePath, { recursive: true });

  // YAML ファイルを読み込んで、名前を変更して保存
  const sourceContent = fs.readFileSync(sourceYamlPath, "utf-8");
  const sourceDef = yaml.load(sourceContent) as SnippetDefinition;

  // 新しい definition オブジェクトを作成
  const targetDef: SnippetDefinition = {
    ...sourceDef,
    name: cloneName,
  };

  const targetContent = serializeSnippetYaml(targetDef);
  fs.writeFileSync(targetYamlPath, targetContent, "utf-8");

  // スニペットディレクトリをコピー
  if (fs.existsSync(sourceDirPath)) {
    fs.mkdirSync(targetDirPath, { recursive: true });
    copyDirRecursive(sourceDirPath, targetDirPath);
  } else {
    fs.mkdirSync(targetDirPath, { recursive: true });
  }

  logger.success(t("clone.success", { name, alias: cloneName }));
  logger.fileItem(path.relative(cwd, targetYamlPath));
  logger.dirItem(`${path.relative(cwd, targetDirPath)}/`);
}

function copyDirRecursive(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function registerCloneCommand(program: Command): void {
  program
    .command("clone <name> [alias]")
    .description("snippet を複製して新規 snippet を作成する")
    .option("-f, --force", "既存 snippet を上書きする")
    .action(async (name: string, alias: string | undefined, opts: CloneOptions) => {
      cloneSnippet(name, { ...opts, alias }, process.cwd());
    })
    .addHelpText("after", `
Examples:
  mir clone react-hook react-hook-custom
  mir clone my-component my-component-v2
  mir clone template --force
  mir clone my-snippet new-name --force`);
}
