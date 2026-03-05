import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { syncSnippet } from "../../commands/sync.js";
import { SnippetNotFoundError } from "../../lib/errors.js";
import type { SnippetDefinition } from "../../lib/snippet-schema.js";

vi.mock("../../lib/logger.js", () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
}));
import * as logger from "../../lib/logger.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-sync-"));
  vi.mocked(logger.success).mockClear();
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.label).mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function createLocalSnippet(
  name: string,
  def: SnippetDefinition,
  files: Record<string, string>,
): void {
  const snippetsDir = path.join(tmpDir, ".mir", "snippets");
  fs.mkdirSync(snippetsDir, { recursive: true });
  fs.writeFileSync(
    path.join(snippetsDir, `${name}.yaml`),
    yaml.dump(def),
    "utf-8",
  );
  const snippetDir = path.join(snippetsDir, name);
  fs.mkdirSync(snippetDir, { recursive: true });
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(snippetDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}

describe("syncSnippet", () => {
  it("未定義の変数を snippet.yaml に追加する", () => {
    createLocalSnippet(
      "my-comp",
      { name: "my-comp", variables: {} },
      { "{{ name }}.ts": "export const {{ name }} = {{ value }};" },
    );

    syncSnippet("my-comp", tmpDir);

    const yamlContent = fs.readFileSync(
      path.join(tmpDir, ".mir/snippets/my-comp.yaml"),
      "utf-8",
    );
    const def = yaml.load(yamlContent) as SnippetDefinition;
    expect(def.variables).toHaveProperty("name");
    expect(def.variables).toHaveProperty("value");
    expect(def.variables?.name?.schema?.type).toBe("string");
  });

  it("既存の変数は上書きしない", () => {
    createLocalSnippet(
      "existing-var",
      {
        name: "existing-var",
        variables: {
          name: { description: "既存の説明", schema: { type: "string" } },
        },
      },
      { "{{ name }}.ts": "{{ name }} {{ newVar }}" },
    );

    syncSnippet("existing-var", tmpDir);

    const yamlContent = fs.readFileSync(
      path.join(tmpDir, ".mir/snippets/existing-var.yaml"),
      "utf-8",
    );
    const def = yaml.load(yamlContent) as SnippetDefinition;
    expect(def.variables?.name?.description).toBe("既存の説明");
    expect(def.variables).toHaveProperty("newVar");
  });

  it("追加する変数がない場合はメッセージを表示する", () => {
    createLocalSnippet(
      "no-new",
      {
        name: "no-new",
        variables: { name: { schema: { type: "string" } } },
      },
      { "file.txt": "{{ name }}" },
    );

    syncSnippet("no-new", tmpDir);

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith("追加する変数はありません");
  });

  it("存在しない snippet でエラー", () => {
    expect(() => syncSnippet("nonexistent", tmpDir)).toThrow(
      SnippetNotFoundError,
    );
  });
});
