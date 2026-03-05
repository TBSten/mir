/**
 * mir-core: テンプレート展開結果の snapshot テスト
 */
import { describe, it, expect } from "vitest";
import { expandTemplate, expandPath } from "../../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe.skip("テンプレート展開結果 snapshot", () => {
  it("React コンポーネントテンプレート", () => {
    const template = `import React from "react";

export interface {{ name }}Props {
  children?: React.ReactNode;
}

export function {{ name }}({ children }: {{ name }}Props) {
  return <div className="{{ name }}">{children}</div>;
}`;
    const result = expandTemplate(template, { name: "Button" });
    expect(result).toMatchSnapshot();
  });

  it("React フックテンプレート", () => {
    const template = `import { useState, useCallback } from "react";

/**
 * {{ description }}
 */
export function {{ name }}() {
  const [state, setState] = useState(null);
  return { state, setState };
}`;
    const result = expandTemplate(template, {
      name: "useAuth",
      description: "認証フック",
    });
    expect(result).toMatchSnapshot();
  });

  it("条件分岐付きテンプレート", () => {
    const template = `{{#if useTypescript}}
import type { FC } from "react";
{{else}}
import React from "react";
{{/if}}

export const {{ name }} = () => {
  return <div>{{ name }}</div>;
};`;
    expect(
      expandTemplate(template, { name: "App", useTypescript: true }),
    ).toMatchSnapshot();
    expect(
      expandTemplate(template, { name: "App", useTypescript: false }),
    ).toMatchSnapshot();
  });

  it("パス展開", () => {
    expect(
      expandPath("{{ dir }}/{{ name }}.ts", { dir: "hooks", name: "useAuth" }),
    ).toMatchSnapshot();
  });

  it("ネストしたディレクトリパス展開", () => {
    expect(
      expandPath("src/{{ module }}/{{ name }}/index.ts", {
        module: "features",
        name: "auth",
      }),
    ).toMatchSnapshot();
  });
});
