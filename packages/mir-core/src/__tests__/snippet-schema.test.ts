/**
 * mir-core: snippet-schema の unit テスト
 */
import { describe, it, expect } from "vitest";
import {
  parseSnippetYaml,
  serializeSnippetYaml,
  validateSnippetDefinition,
  ValidationError,
} from "../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe("parseSnippetYaml", () => {
  it("最小限の YAML をパースできる", () => {
    const def = parseSnippetYaml("name: my-snippet\n");
    expect(def.name).toBe("my-snippet");
  });

  it("変数付き YAML をパースできる", () => {
    const yaml = `
name: react-hook
description: React カスタムフック
variables:
  name:
    description: フック名
    schema:
      type: string
`;
    const def = parseSnippetYaml(yaml);
    expect(def.name).toBe("react-hook");
    expect(def.variables?.name?.description).toBe("フック名");
    expect(def.variables?.name?.schema?.type).toBe("string");
  });

  it("hooks 付き YAML をパースできる", () => {
    const yaml = `
name: test-snippet
hooks:
  before-install:
    - echo: "Installing..."
  after-install:
    - echo: "Done!"
`;
    const def = parseSnippetYaml(yaml);
    expect(def.hooks?.["before-install"]).toHaveLength(1);
    expect(def.hooks?.["after-install"]).toHaveLength(1);
  });

  it("dependencies 付き YAML をパースできる", () => {
    const yaml = `
name: react-component
description: React component
dependencies:
  - react-hook
  - typescript-setup
`;
    const def = parseSnippetYaml(yaml);
    expect(def.dependencies).toEqual(["react-hook", "typescript-setup"]);
  });

  it("不正な YAML でエラー", () => {
    expect(() => parseSnippetYaml("not a yaml object: [")).toThrow();
  });

  it("name がない YAML でエラー", () => {
    expect(() => parseSnippetYaml("description: no name\n")).toThrow(
      ValidationError,
    );
  });
});

describe("serializeSnippetYaml", () => {
  it("SnippetDefinition を YAML 文字列に変換する", () => {
    const yaml = serializeSnippetYaml({ name: "test" });
    expect(yaml).toContain("name: test");
  });

  it("パースと逆変換で元に戻る", () => {
    const original = { name: "test", description: "desc" };
    const yaml = serializeSnippetYaml(original);
    const parsed = parseSnippetYaml(yaml);
    expect(parsed.name).toBe(original.name);
    expect(parsed.description).toBe(original.description);
  });
});

describe("validateSnippetDefinition", () => {
  it("最小限の定義はバリデーション通過", () => {
    expect(() => validateSnippetDefinition({ name: "valid" })).not.toThrow();
  });

  it("name が空だとエラー", () => {
    expect(() => validateSnippetDefinition({ name: "" })).toThrow(
      ValidationError,
    );
  });

  it("suggests が配列でないとエラー", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          key: { suggests: "not-array" as unknown as string[] },
        },
      }),
    ).toThrow(ValidationError);
  });

  it("schema.type が不正だとエラー", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          key: {
            schema: { type: "invalid" as "string" },
          },
        },
      }),
    ).toThrow(ValidationError);
  });

  it("正しい schema.type は通過 (string, number, boolean)", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          a: { schema: { type: "string" } },
          b: { schema: { type: "number" } },
          c: { schema: { type: "boolean" } },
        },
      }),
    ).not.toThrow();
  });

  it("dependencies が配列の場合は通過", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "react-component",
        dependencies: ["react-hook"],
      }),
    ).not.toThrow();
  });

  it("dependencies に複数要素を持つ場合は通過", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        dependencies: ["dep1", "dep2", "dep3"],
      }),
    ).not.toThrow();
  });

  it("dependencies が配列でないとエラー", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        dependencies: "not-array" as unknown as string[],
      }),
    ).toThrow(ValidationError);
  });

  it("dependencies の要素が文字列でないとエラー", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        dependencies: ["valid-dep", 123 as unknown as string],
      }),
    ).toThrow(ValidationError);
  });

  it("dependencies の要素に不正な名前があるとエラー", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        dependencies: ["-invalid-dep-name"],
      }),
    ).toThrow(ValidationError);
  });
});
