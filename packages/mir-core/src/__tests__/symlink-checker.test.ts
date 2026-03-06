import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isSymbolicLink, findSymlinksInDirectory } from "../lib/symlink-checker.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-symlink-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("isSymbolicLink", () => {
  it("通常のファイルに対して false を返す", () => {
    const filePath = path.join(tmpDir, "regular.txt");
    fs.writeFileSync(filePath, "content");
    expect(isSymbolicLink(filePath)).toBe(false);
  });

  it("ディレクトリに対して false を返す", () => {
    const dirPath = path.join(tmpDir, "subdir");
    fs.mkdirSync(dirPath);
    expect(isSymbolicLink(dirPath)).toBe(false);
  });

  it("シンボリックリンクに対して true を返す", () => {
    const targetPath = path.join(tmpDir, "target.txt");
    const linkPath = path.join(tmpDir, "link.txt");
    fs.writeFileSync(targetPath, "content");
    fs.symlinkSync(targetPath, linkPath);
    expect(isSymbolicLink(linkPath)).toBe(true);
  });

  it("存在しないパスに対して false を返す", () => {
    expect(isSymbolicLink(path.join(tmpDir, "nonexistent"))).toBe(false);
  });
});

describe("findSymlinksInDirectory", () => {
  it("シンボリックリンクがない場合 hasSymlinks=false を返す", () => {
    fs.writeFileSync(path.join(tmpDir, "index.ts"), "content");
    const result = findSymlinksInDirectory(tmpDir);
    expect(result.hasSymlinks).toBe(false);
    expect(result.symlinkPaths).toHaveLength(0);
  });

  it("シンボリックリンクを検出する", () => {
    const targetPath = path.join(tmpDir, "target.txt");
    const linkPath = path.join(tmpDir, "link.txt");
    fs.writeFileSync(targetPath, "content");
    fs.symlinkSync(targetPath, linkPath);

    const result = findSymlinksInDirectory(tmpDir);
    expect(result.hasSymlinks).toBe(true);
    expect(result.symlinkPaths).toContain("link.txt");
  });

  it("サブディレクトリ内のシンボリックリンクを検出する", () => {
    const subDir = path.join(tmpDir, "src");
    fs.mkdirSync(subDir);
    const targetPath = path.join(tmpDir, "target.txt");
    const linkPath = path.join(subDir, "link.txt");
    fs.writeFileSync(targetPath, "content");
    fs.symlinkSync(targetPath, linkPath);

    const result = findSymlinksInDirectory(tmpDir);
    expect(result.hasSymlinks).toBe(true);
    expect(result.symlinkPaths.some((p) => p.includes("link.txt"))).toBe(true);
  });

  it("複数のシンボリックリンクをすべて検出する", () => {
    const target1 = path.join(tmpDir, "target1.txt");
    const target2 = path.join(tmpDir, "target2.txt");
    const link1 = path.join(tmpDir, "link1.txt");
    const link2 = path.join(tmpDir, "link2.txt");
    fs.writeFileSync(target1, "content1");
    fs.writeFileSync(target2, "content2");
    fs.symlinkSync(target1, link1);
    fs.symlinkSync(target2, link2);

    const result = findSymlinksInDirectory(tmpDir);
    expect(result.hasSymlinks).toBe(true);
    expect(result.symlinkPaths).toHaveLength(2);
  });

  it("存在しないディレクトリに対して空の結果を返す", () => {
    const result = findSymlinksInDirectory(path.join(tmpDir, "nonexistent"));
    expect(result.hasSymlinks).toBe(false);
    expect(result.symlinkPaths).toHaveLength(0);
  });
});
