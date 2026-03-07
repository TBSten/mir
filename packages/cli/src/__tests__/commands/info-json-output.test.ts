import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { showSnippetInfo } from "../../commands/info.js";
import { SnippetNotFoundError, type SnippetDefinition } from "@tbsten/mir-core";

// logger モジュールをモック
vi.mock("../../lib/logger.js", () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
  infoForOutput: vi.fn(),
  setOutputMode: vi.fn(),
}));

// snippet-list モジュールをモック
vi.mock("../../lib/snippet-list.js", () => ({
  selectSnippet: vi.fn(),
}));

let tmpDir: string;
let registryDir: string;
let configPath: string;

function setupSnippet(
  name: string,
  def: SnippetDefinition,
): void {
  fs.writeFileSync(
    path.join(registryDir, `${name}.yaml`),
    yaml.dump(def),
    "utf-8",
  );
  const snippetDir = path.join(registryDir, name);
  fs.mkdirSync(snippetDir, { recursive: true });
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-test-info-json-"));
  registryDir = path.join(tmpDir, "registry");
  fs.mkdirSync(registryDir, { recursive: true });

  configPath = path.join(tmpDir, "mirconfig.yaml");
  fs.writeFileSync(
    configPath,
    yaml.dump({ registries: [{ name: "default", path: registryDir }] }),
    "utf-8",
  );

  vi.resetAllMocks();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("showSnippetInfo JSON/YAML output", () => {
  it("JSON 出力時にコンソール出力を使う", async () => {
    setupSnippet("test", {
      name: "test",
      description: "Test",
      variables: {
        name: {
          name: "Name",
          description: "Your name",
          schema: { type: "string", default: "John" },
        },
      },
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await showSnippetInfo("test", { json: true }, configPath);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.name).toBe("test");
    expect(parsed.variables.name.type).toBe("string");
    expect(parsed.variables.name.default).toBe("John");

    consoleSpy.mockRestore();
  });

  it("YAML 出力時にコンソール出力を使う", async () => {
    setupSnippet("test", {
      name: "test",
      description: "Test",
      variables: {
        name: {
          name: "Name",
          description: "Your name",
          schema: { type: "string" },
        },
      },
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await showSnippetInfo("test", { yaml: true }, configPath);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = yaml.load(output) as Record<string, unknown>;
    expect(parsed.name).toBe("test");

    consoleSpy.mockRestore();
  });

  it("required フラグが正しく設定される", async () => {
    setupSnippet("test", {
      name: "test",
      variables: {
        required_var: {
          name: "Required",
          schema: { type: "string" },
        },
        optional_var: {
          name: "Optional",
          schema: { type: "string", default: "default_value" },
        },
      },
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await showSnippetInfo("test", { json: true }, configPath);

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.variables.required_var.required).toBe(true);
    expect(parsed.variables.optional_var.default).toBe("default_value");
    expect(parsed.variables.optional_var.required).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("suggests 配列が含まれる", async () => {
    setupSnippet("test", {
      name: "test",
      variables: {
        lang: {
          name: "Language",
          schema: { type: "string" },
          suggests: ["TypeScript", "JavaScript", "Python"],
        },
      },
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await showSnippetInfo("test", { json: true }, configPath);

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.variables.lang.suggests).toEqual(["TypeScript", "JavaScript", "Python"]);

    consoleSpy.mockRestore();
  });
});
