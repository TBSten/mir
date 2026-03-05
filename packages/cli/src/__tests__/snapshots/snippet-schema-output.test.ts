import { describe, it, expect } from "vitest";
import { serializeSnippetYaml, type SnippetDefinition } from "@mir/core";

describe("snippet YAML シリアライズ snapshot", () => {
  it("最小の snippet 定義", () => {
    const def: SnippetDefinition = { name: "minimal" };
    expect(serializeSnippetYaml(def)).toMatchSnapshot();
  });

  it("変数付き snippet 定義", () => {
    const def: SnippetDefinition = {
      name: "with-vars",
      description: "テスト用 snippet",
      variables: {
        name: {
          description: "コンポーネント名",
          schema: { type: "string" },
        },
        count: {
          schema: { type: "number", default: 3 },
        },
        framework: {
          suggests: ["react", "vue", "svelte"],
          schema: { type: "string", default: "react" },
        },
      },
    };
    expect(serializeSnippetYaml(def)).toMatchSnapshot();
  });

  it("hooks 付き snippet 定義", () => {
    const def: SnippetDefinition = {
      name: "with-hooks",
      variables: {
        name: { schema: { type: "string" } },
      },
      hooks: {
        "before-install": [
          { echo: "Installing {{ name }}..." },
          { exit: true, if: "{{ skipInstall }}" },
        ],
        "after-install": [
          { echo: "Done! Created {{ name }}" },
        ],
      },
    };
    expect(serializeSnippetYaml(def)).toMatchSnapshot();
  });

  it("全フィールドを含む snippet 定義", () => {
    const def: SnippetDefinition = {
      name: "full-example",
      description: "全フィールドを含む例",
      variables: {
        name: {
          name: "コンポーネント名",
          description: "生成するコンポーネントの名前",
          suggests: ["Button", "Input", "Modal"],
          schema: { type: "string" },
        },
        useTs: {
          description: "TypeScript を使用するか",
          suggests: ["true", "false"],
          schema: { type: "boolean", default: true },
        },
      },
      hooks: {
        "before-install": [
          { echo: "Creating {{ name }}..." },
          {
            input: {
              "confirm-ts": {
                name: "TypeScript",
                description: "TypeScript を使いますか？",
                schema: { type: "boolean", default: true },
                "answer-to": "useTs",
              },
            },
          },
        ],
        "after-install": [
          { echo: "{{ name }} was created successfully!" },
        ],
      },
    };
    expect(serializeSnippetYaml(def)).toMatchSnapshot();
  });
});
