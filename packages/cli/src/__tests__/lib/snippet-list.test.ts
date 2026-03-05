import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listLocalSnippets } from "../../lib/snippet-list.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-snippet-list-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("listLocalSnippets", () => {
  it(".mir/snippets/ がない場合は空配列を返す", () => {
    expect(listLocalSnippets(tmpDir)).toEqual([]);
  });

  it("YAML ファイルから snippet 名一覧を返す", () => {
    const snippetsDir = path.join(tmpDir, ".mir", "snippets");
    fs.mkdirSync(snippetsDir, { recursive: true });
    fs.writeFileSync(path.join(snippetsDir, "comp-a.yaml"), "name: comp-a", "utf-8");
    fs.writeFileSync(path.join(snippetsDir, "comp-b.yaml"), "name: comp-b", "utf-8");
    fs.mkdirSync(path.join(snippetsDir, "comp-a")); // ディレクトリは無視

    const result = listLocalSnippets(tmpDir);
    expect(result).toEqual(["comp-a", "comp-b"]);
  });

  it("YAML 以外のファイルは無視する", () => {
    const snippetsDir = path.join(tmpDir, ".mir", "snippets");
    fs.mkdirSync(snippetsDir, { recursive: true });
    fs.writeFileSync(path.join(snippetsDir, "valid.yaml"), "name: valid", "utf-8");
    fs.writeFileSync(path.join(snippetsDir, "readme.md"), "# readme", "utf-8");

    const result = listLocalSnippets(tmpDir);
    expect(result).toEqual(["valid"]);
  });
});
