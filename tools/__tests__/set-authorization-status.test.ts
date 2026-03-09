import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const SCRIPT_PATH = path.resolve(__dirname, "../set-authorization-status.sh");

/**
 * シェルスクリプトの引数バリデーションテスト。
 * 実際の DB 操作は行わず、引数チェック部分のみテストする。
 */
describe("set-authorization-status.sh 引数バリデーション", () => {
  it("スクリプトファイルが存在する", () => {
    expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
  });

  it("スクリプトが実行可能", () => {
    const stats = fs.statSync(SCRIPT_PATH);
    // owner execute bit
    expect(stats.mode & 0o100).toBeTruthy();
  });

  it("引数なしで exit 1", () => {
    try {
      execFileSync("bash", [SCRIPT_PATH], { stdio: "pipe" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.status).toBe(1);
      const stderr = e.stderr?.toString() || e.stdout?.toString() || "";
      expect(stderr).toContain("Usage");
    }
  });

  it("snippet 名のみで exit 1", () => {
    try {
      execFileSync("bash", [SCRIPT_PATH, "my-snippet"], { stdio: "pipe" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.status).toBe(1);
    }
  });

  it("不正なステータスで exit 1", () => {
    const invalidStatuses = ["invalid", "approve", "APPROVED", "pending", ""];
    for (const status of invalidStatuses) {
      try {
        execFileSync("bash", [SCRIPT_PATH, "test-snippet", status], {
          stdio: "pipe",
        });
        expect.unreachable(`Should have thrown for status: "${status}"`);
      } catch (e: any) {
        expect(e.status).toBe(1);
        const output = e.stderr?.toString() || e.stdout?.toString() || "";
        if (status !== "") {
          expect(output).toContain("Error");
        }
      }
    }
  });

  it("有効なステータスは approved, rejected, examination の 3 つ", () => {
    // wrangler.jsonc が存在しない環境では DB 操作前にエラーになるが、
    // ステータスバリデーションは通過する
    const validStatuses = ["approved", "rejected", "examination"];
    for (const status of validStatuses) {
      try {
        execFileSync("bash", [SCRIPT_PATH, "test-snippet", status], {
          stdio: "pipe",
        });
      } catch (e: any) {
        // ステータスバリデーション以外のエラー（wrangler.jsonc not found 等）は OK
        const output = e.stderr?.toString() || e.stdout?.toString() || "";
        // ステータスバリデーションエラーではないことを確認
        expect(output).not.toContain("status must be one of");
      }
    }
  });
});
