/**
 * mir-core: snippet スキーマ処理結果の snapshot テスト
 */
import { describe, it, expect } from "vitest";
import { parseSnippetYaml, serializeSnippetYaml } from "../../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe("snippet スキーマ snapshot", () => {
  it("最小限の snippet 定義の YAML 出力", () => {
    const yaml = serializeSnippetYaml({ name: "minimal" });
    expect(yaml).toMatchSnapshot();
  });

  it("変数付き snippet 定義の YAML 出力", () => {
    const yaml = serializeSnippetYaml({
      name: "react-hook",
      description: "React カスタムフック雛形",
      variables: {
        name: {
          description: "フック名",
          schema: { type: "string" },
        },
        description: {
          description: "説明文",
          schema: { type: "string", default: "" },
        },
      },
    });
    expect(yaml).toMatchSnapshot();
  });

  it("hooks 付き snippet 定義の YAML 出力", () => {
    const yaml = serializeSnippetYaml({
      name: "with-hooks",
      hooks: {
        "before-install": [
          { echo: "インストールを開始します" },
          {
            input: {
              confirm: {
                description: "続行しますか？",
                "answer-to": "confirmed",
                schema: { type: "boolean", default: true },
              },
            },
          },
        ],
        "after-install": [
          { echo: "✅ インストール完了" },
        ],
      },
    });
    expect(yaml).toMatchSnapshot();
  });

  it("suggests 付き変数の YAML 出力", () => {
    const yaml = serializeSnippetYaml({
      name: "css-setup",
      variables: {
        framework: {
          description: "CSSフレームワーク",
          suggests: ["tailwind", "vanilla-extract", "css-modules"],
          schema: { type: "string", default: "tailwind" },
        },
      },
    });
    expect(yaml).toMatchSnapshot();
  });

  it("フル構成 YAML のパース → シリアライズ往復", () => {
    const input = `
name: full-example
description: フル構成のサンプル
variables:
  name:
    description: コンポーネント名
    schema:
      type: string
  framework:
    description: フレームワーク
    suggests:
      - react
      - vue
    schema:
      type: string
      default: react
hooks:
  before-install:
    - echo: "セットアップ中..."
  after-install:
    - echo: "完了: {{ name }}"
`;
    const parsed = parseSnippetYaml(input);
    const serialized = serializeSnippetYaml(parsed);
    expect(serialized).toMatchSnapshot();
  });
});
