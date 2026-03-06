import { describe, it, expect } from "vitest";
import { spawn } from "child_process";
import path from "node:path";

const CLI_PATH = path.resolve(__dirname, "../../dist/cli.js");

/**
 * CLI コマンドを実行して exit code を確認
 */
async function runCli(args: string[]): Promise<{
  code: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const proc = spawn("node", [CLI_PATH, ...args]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });
  });
}

describe("Exit Codes", () => {
  describe("成功時 (exit code 0)", () => {
    it("mir --help", async () => {
      const result = await runCli(["--help"]);
      expect(result.code).toBe(0);
    });

    it("mir --version", async () => {
      const result = await runCli(["--version"]);
      expect(result.code).toBe(0);
    });
  });

  describe("引数エラー (exit code 2)", () => {
    it.todo("不正なコマンド", async () => {
      const result = await runCli(["invalid-command"]);
      expect(result.code).toBe(2);
    });

    it.todo("必須引数なし", async () => {
      const result = await runCli(["info"]);
      // info <name> は引数が必須
      expect(result.code).toBe(2);
    });
  });

  describe("一般エラー (exit code 1)", () => {
    it.todo("snippet が見つからない", async () => {
      const result = await runCli(["info", "nonexistent-snippet"]);
      expect(result.code).toBe(1);
      // SnippetNotFoundError のメッセージを確認
      expect(result.stderr).toContain("found");
    });
  });
});
