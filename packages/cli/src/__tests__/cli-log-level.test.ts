import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI log level options", () => {
  const cwd = process.cwd();

  it.todo("should accept --verbose flag", () => {
    // 実行してエラーが出ないことを確認
    // コマンド例: mir --verbose --help
    // TODO: --verbose オプション実装後に有効化
    expect(() => {
      execSync("npm run mir -- --verbose --help", { cwd });
    }).not.toThrow();
  });

  it.todo("should accept --quiet flag", () => {
    // TODO: --quiet オプション実装後に有効化
    expect(() => {
      execSync("npm run mir -- --quiet --help", { cwd });
    }).not.toThrow();
  });

  it.todo(
    "should accept both --verbose and --quiet (--quiet takes precedence)",
    () => {
      // TODO: --verbose, --quiet オプション実装後に有効化
      expect(() => {
        execSync("npm run mir -- --verbose --quiet --help", { cwd });
      }).not.toThrow();
    }
  );

  // TODO: --verbose, --quiet の実装後に有効化
  // it('should default to info level', () => {
  //   expect(() => {
  //     execSync('npm run mir -- --help', { cwd });
  //   }).not.toThrow();
  // });
  //
  // it('should accept --verbose after command', () => {
  //   expect(() => {
  //     execSync('npm run mir -- list --verbose', { cwd });
  //   }).not.toThrow();
  // });

  // --verbose, --quiet の実際の効果確認は snapshot test 推奨
  // (ログ出力は stderr なので、スナップショット化が複雑)
});
