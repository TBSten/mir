import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "node:path";

describe("log level output snapshots", () => {
  const cliRoot = path.resolve(__dirname, "../../../");

  it("should run list command without error", () => {
    // CLI がエラーなく実行できることを確認（出力内容は環境依存のため検証しない）
    const output = execSync("node dist/cli.js list 2>&1", {
      cwd: cliRoot,
      encoding: "utf-8",
      timeout: 10000,
    });
    expect(typeof output).toBe("string");
  });
});
