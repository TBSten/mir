import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { MirError, t } from "@tbsten/mir-core";
import * as logger from "../lib/logger.js";
import { confirm } from "../lib/prompt.js";

const SNIPPETS_SUBDIR = "snippets";
const CONFIG_FILE = "mirconfig.yaml";
const SAMPLE_SNIPPET_YAML = `name: hello-world
description: シンプルな Hello World スニペット

variables:
  name:
    name: プロジェクト名
    description: あなたのプロジェクト名を入力してください
`;

const SAMPLE_SNIPPET_FILES = {
  "hello.txt": "Hello {{name}}!",
  "index.js": "console.log('Hello {{name}}!');",
};

const SAMPLE_MIRCONFIG = `# mir config
#
# registry:
#   - name: default
#     path: ~/.mir/registry
#
# locale: ja

registry:
  - name: default
    path: ~/.mir/registry
`;

export async function initProject(
  cwd: string = process.cwd(),
  opts: { force?: boolean; interactive?: boolean } = {}
): Promise<void> {
  const mirDir = path.join(cwd, ".mir");
  const snippetsDir = path.join(mirDir, SNIPPETS_SUBDIR);
  const configPath = path.join(cwd, CONFIG_FILE);

  // .mir ディレクトリが既に存在する場合
  if (fs.existsSync(mirDir)) {
    if (opts.force) {
      // --force 指定時: 既存ディレクトリを削除
      fs.rmSync(mirDir, { recursive: true });
      // 設定ファイルも削除
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      logger.warn("既存の .mir/ ディレクトリを削除します");
    } else if (opts.interactive) {
      // 対話モード: 確認を取得
      const shouldDelete = await confirm(
        "既存の .mir/ ディレクトリを削除してもよろしいですか?"
      );
      if (!shouldDelete) {
        logger.info("初期化をキャンセルしました");
        return;
      }
      fs.rmSync(mirDir, { recursive: true });
      // 設定ファイルも削除
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    } else {
      // 非対話モード: エラー
      throw new MirError(".mir ディレクトリは既に存在します");
    }
  }

  try {
    // .mir ディレクトリを作成
    fs.mkdirSync(snippetsDir, { recursive: true });
    logger.success("✓ .mir ディレクトリを作成しました");

    // サンプル snippet を作成
    const sampleSnippetPath = path.join(snippetsDir, "hello-world.yaml");
    fs.writeFileSync(sampleSnippetPath, SAMPLE_SNIPPET_YAML, "utf-8");

    // サンプル snippet ファイルを作成
    const sampleFilesDir = path.join(snippetsDir, "hello-world");
    fs.mkdirSync(sampleFilesDir, { recursive: true });

    for (const [filename, content] of Object.entries(SAMPLE_SNIPPET_FILES)) {
      fs.writeFileSync(path.join(sampleFilesDir, filename), content, "utf-8");
    }
    logger.success("✓ サンプル snippet (hello-world) を作成しました");

    // mirconfig.yaml を作成
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, SAMPLE_MIRCONFIG, "utf-8");
      logger.success("✓ mirconfig.yaml を作成しました");
    }

    logger.info("");
    logger.step("初期化が完了しました!");
    logger.info("\n次のステップ:");
    logger.info("  1. mir list          # 利用可能な snippet を確認");
    logger.info("  2. mir info hello-world  # サンプル snippet の詳細を確認");
    logger.info("  3. mir create my-snippet # 新しい snippet を作成");
  } catch (error) {
    // ロールバック
    if (fs.existsSync(mirDir)) {
      fs.rmSync(mirDir, { recursive: true });
    }
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new MirError("初期化に失敗しました");
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description(".mir ディレクトリを初期化する")
    .option("-f, --force", "既存ディレクトリを上書き", false)
    .addHelpText("after", `
Examples:
  mir init
  mir init --force`)
    .action(async (opts: { force?: boolean }) => {
      await initProject(process.cwd(), {
        force: opts.force,
        interactive: true,
      });
    });
}
