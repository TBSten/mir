import { describe, it, expect } from "vitest";
import os from "node:os";
import path from "node:path";
import {
  expandTilde,
  snippetYamlPath,
  snippetDirPath,
  snippetsBasePath,
  globalConfigPath,
  localConfigPath,
  defaultRegistryPath,
} from "../../lib/paths.js";

describe("expandTilde", () => {
  it("~ をホームディレクトリに展開する", () => {
    expect(expandTilde("~/.mir")).toBe(path.join(os.homedir(), ".mir"));
  });

  it("~ 単体を展開する", () => {
    expect(expandTilde("~")).toBe(os.homedir());
  });

  it("~ で始まらないパスはそのまま返す", () => {
    expect(expandTilde("/absolute/path")).toBe("/absolute/path");
    expect(expandTilde("relative/path")).toBe("relative/path");
  });
});

describe("snippetsBasePath", () => {
  it(".mir/snippets/ パスを返す", () => {
    expect(snippetsBasePath("/project")).toBe("/project/.mir/snippets");
  });
});

describe("snippetYamlPath", () => {
  it("snippet YAML のパスを返す", () => {
    expect(snippetYamlPath("/project", "my-comp")).toBe(
      "/project/.mir/snippets/my-comp.yaml",
    );
  });
});

describe("snippetDirPath", () => {
  it("snippet ディレクトリのパスを返す", () => {
    expect(snippetDirPath("/project", "my-comp")).toBe(
      "/project/.mir/snippets/my-comp",
    );
  });
});

describe("globalConfigPath", () => {
  it("~/.mir/config.yaml のパスを返す", () => {
    expect(globalConfigPath()).toBe(
      path.join(os.homedir(), ".mir", "config.yaml"),
    );
  });
});

describe("localConfigPath", () => {
  it(".mir/config.yaml のパスを返す", () => {
    expect(localConfigPath("/project")).toBe("/project/.mir/config.yaml");
  });
});

describe("defaultRegistryPath", () => {
  it("~/.mir/registry のパスを返す", () => {
    expect(defaultRegistryPath()).toBe(
      path.join(os.homedir(), ".mir", "registry"),
    );
  });
});
