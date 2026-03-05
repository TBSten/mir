import { describe, it, expect } from "vitest";
import {
  parseSnippetYaml,
  serializeSnippetYaml,
  validateSnippetDefinition,
} from "../../lib/snippet-schema.js";
import { ValidationError } from "../../lib/errors.js";

describe("parseSnippetYaml", () => {
  it("最小限の YAML をパースする", () => {
    const yaml = "name: test-snippet\n";
    const result = parseSnippetYaml(yaml);
    expect(result.name).toBe("test-snippet");
  });

  it("全フィールドを持つ YAML をパースする", () => {
    const yaml = `
name: react-hook
description: "React カスタムフック"
variables:
  name:
    description: "フック名"
    schema:
      type: string
  with-test:
    description: "テストを含む"
    schema:
      type: boolean
      default: true
hooks:
  before-install:
    - echo: "作成開始"
  after-install:
    - echo: "完了"
`;
    const result = parseSnippetYaml(yaml);
    expect(result.name).toBe("react-hook");
    expect(result.description).toBe("React カスタムフック");
    expect(result.variables?.name?.schema?.type).toBe("string");
    expect(result.variables?.["with-test"]?.schema?.default).toBe(true);
    expect(result.hooks?.["before-install"]).toHaveLength(1);
    expect(result.hooks?.["after-install"]).toHaveLength(1);
  });

  it("無効な YAML でエラーを投げる", () => {
    expect(() => parseSnippetYaml("")).toThrow(ValidationError);
  });

  it("name が無い YAML でエラーを投げる", () => {
    expect(() => parseSnippetYaml("description: test\n")).toThrow(
      ValidationError,
    );
  });
});

describe("serializeSnippetYaml", () => {
  it("SnippetDefinition を YAML 文字列にシリアライズする", () => {
    const def = {
      name: "test",
      description: "",
      variables: {},
      hooks: { "before-install": [], "after-install": [] },
    };
    const result = serializeSnippetYaml(def);
    expect(result).toContain("name: test");
  });
});

describe("validateSnippetDefinition", () => {
  it("有効な定義を受け入れる", () => {
    expect(() =>
      validateSnippetDefinition({ name: "valid-name" }),
    ).not.toThrow();
  });

  it("不正な名前でエラーを投げる", () => {
    expect(() => validateSnippetDefinition({ name: "-invalid" })).toThrow(
      ValidationError,
    );
  });

  it("不正な変数 type でエラーを投げる", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          v: { schema: { type: "invalid" as "string" } },
        },
      }),
    ).toThrow(ValidationError);
  });

  it("suggests 付きの定義を受け入れる", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          framework: {
            suggests: ["react", "vue", "svelte"],
            schema: { type: "string" },
          },
        },
      }),
    ).not.toThrow();
  });

  it("suggests が配列でない場合エラーを投げる", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          v: { suggests: "not-array" as unknown as string[] },
        },
      }),
    ).toThrow(ValidationError);
  });

  it("suggests の要素が文字列でない場合エラーを投げる", () => {
    expect(() =>
      validateSnippetDefinition({
        name: "test",
        variables: {
          v: { suggests: [1, 2] as unknown as string[] },
        },
      }),
    ).toThrow(ValidationError);
  });
});

describe("parseSnippetYaml - suggests", () => {
  it("suggests 付き YAML をパースする", () => {
    const yamlStr = `
name: test-suggests
variables:
  framework:
    description: "フレームワーク"
    suggests:
      - react
      - vue
      - svelte
    schema:
      type: string
`;
    const result = parseSnippetYaml(yamlStr);
    expect(result.variables?.framework?.suggests).toEqual([
      "react",
      "vue",
      "svelte",
    ]);
  });
});
