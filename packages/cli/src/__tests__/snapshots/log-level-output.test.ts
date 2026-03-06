import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("log level output snapshots", () => {
  const cwd = process.cwd();

  it.skip("should match default log output", () => {
    // TODO: snapshot テスト用の環境整備後に有効化（テンポラリディレクトリ設定など）
    const output = execSync("npm run mir -- list 2>&1", {
      cwd,
      encoding: "utf-8",
    });
    expect(output).toMatchSnapshot();
  });

  // TODO: --verbose, --quiet の実装後に有効化
  // it('should match verbose log output', () => {
  //   const output = execSync('npm run mir -- --verbose list 2>&1', {
  //     cwd,
  //     encoding: 'utf-8',
  //   });
  //   expect(output).toMatchSnapshot();
  // });
  //
  // it('should match quiet log output', () => {
  //   const output = execSync('npm run mir -- --quiet list 2>&1', {
  //     cwd,
  //     encoding: 'utf-8',
  //   });
  //   expect(output).toMatchSnapshot();
  // });
});
