import { describe, it, expect } from "vitest";
import {
  computeHash,
  computeSnippetHash,
  isValidHashFormat,
  verifyHash,
} from "../../lib/hash.js";

describe("computeHash", () => {
  it("文字列の sha256 ハッシュを返す", () => {
    const result = computeHash("hello");
    expect(result).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("同じ入力に対して同じハッシュを返す", () => {
    const hash1 = computeHash("same content");
    const hash2 = computeHash("same content");
    expect(hash1).toBe(hash2);
  });

  it("異なる入力に対して異なるハッシュを返す", () => {
    const hash1 = computeHash("content A");
    const hash2 = computeHash("content B");
    expect(hash1).not.toBe(hash2);
  });

  it("空文字列のハッシュを計算できる", () => {
    const result = computeHash("");
    expect(result).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("computeSnippetHash", () => {
  it("ファイルマップのハッシュを計算する", () => {
    const files = new Map([
      ["src/index.ts", "export const hello = 'world';"],
      ["README.md", "# Hello"],
    ]);
    const result = computeSnippetHash(files);
    expect(result).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("同じファイルマップに対して同じハッシュを返す", () => {
    const files1 = new Map([
      ["src/index.ts", "export const hello = 'world';"],
    ]);
    const files2 = new Map([
      ["src/index.ts", "export const hello = 'world';"],
    ]);
    expect(computeSnippetHash(files1)).toBe(computeSnippetHash(files2));
  });

  it("ファイル順序が異なっても同じハッシュを返す（ソートされるため）", () => {
    const files1 = new Map([
      ["a.ts", "content a"],
      ["b.ts", "content b"],
    ]);
    const files2 = new Map([
      ["b.ts", "content b"],
      ["a.ts", "content a"],
    ]);
    expect(computeSnippetHash(files1)).toBe(computeSnippetHash(files2));
  });

  it("コンテンツが異なると異なるハッシュを返す", () => {
    const files1 = new Map([["index.ts", "v1"]]);
    const files2 = new Map([["index.ts", "v2"]]);
    expect(computeSnippetHash(files1)).not.toBe(computeSnippetHash(files2));
  });

  it("ファイル名が異なると異なるハッシュを返す", () => {
    const files1 = new Map([["a.ts", "content"]]);
    const files2 = new Map([["b.ts", "content"]]);
    expect(computeSnippetHash(files1)).not.toBe(computeSnippetHash(files2));
  });
});

describe("isValidHashFormat", () => {
  it("有効な sha256 形式を受け入れる", () => {
    const validHash = "sha256:" + "a".repeat(64);
    expect(isValidHashFormat(validHash)).toBe(true);
  });

  it("hex 文字（a-f, 0-9）で構成された 64 文字のハッシュを受け入れる", () => {
    const validHash = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(isValidHashFormat(validHash)).toBe(true);
  });

  it("無効なプレフィックスを拒否する", () => {
    expect(isValidHashFormat("md5:abc123")).toBe(false);
  });

  it("短すぎるハッシュを拒否する", () => {
    expect(isValidHashFormat("sha256:abc123")).toBe(false);
  });

  it("大文字を含むハッシュを拒否する", () => {
    const upperHash = "sha256:" + "A".repeat(64);
    expect(isValidHashFormat(upperHash)).toBe(false);
  });

  it("空文字列を拒否する", () => {
    expect(isValidHashFormat("")).toBe(false);
  });
});

describe("verifyHash", () => {
  it("同じハッシュ同士を一致と判定する", () => {
    const hash = "sha256:" + "a".repeat(64);
    expect(verifyHash(hash, hash)).toBe(true);
  });

  it("異なるハッシュを不一致と判定する", () => {
    const hash1 = "sha256:" + "a".repeat(64);
    const hash2 = "sha256:" + "b".repeat(64);
    expect(verifyHash(hash1, hash2)).toBe(false);
  });

  it("computeHash と組み合わせて使用できる", () => {
    const content = "test content";
    const expected = computeHash(content);
    const actual = computeHash(content);
    expect(verifyHash(expected, actual)).toBe(true);
  });
});
