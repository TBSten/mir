import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expandTemplate, expandPath, expandTemplateDirectory } from "@tbsten/mir-core";

describe("テンプレート展開 snapshot", () => {
  it("単純な変数展開", () => {
    const result = expandTemplate("Hello {{ name }}, welcome to {{ project }}!", {
      name: "Alice",
      project: "mir",
    });
    expect(result).toMatchSnapshot();
  });

  it("#if ブロック展開 (true)", () => {
    const template = `{{#if useTs}}
import type { Component } from "react";
{{else}}
import { Component } from "react";
{{/if}}

export const {{ name }}: Component = () => {
  return <div>{{ name }}</div>;
};`;
    expect(expandTemplate(template, { useTs: true, name: "MyComp" })).toMatchSnapshot();
  });

  it("#if ブロック展開 (false)", () => {
    const template = `{{#if useTs}}
import type { Component } from "react";
{{else}}
import { Component } from "react";
{{/if}}

export const {{ name }}: Component = () => {
  return <div>{{ name }}</div>;
};`;
    expect(expandTemplate(template, { useTs: false, name: "MyComp" })).toMatchSnapshot();
  });

  it("#each ブロック展開", () => {
    const template = `{{#each imports}}
import { {{this}} } from "./{{this}}";
{{/each}}

export { {{#each imports}}{{this}}, {{/each}} };`;
    expect(
      expandTemplate(template, { imports: ["Button", "Input", "Select"] }),
    ).toMatchSnapshot();
  });

  it("パス展開", () => {
    const result = expandPath(
      path.join("src", "{{ dir }}", "{{ name }}.{{ ext }}"),
      { dir: "components", name: "Button", ext: "tsx" },
    );
    expect(result).toMatchSnapshot();
  });
});

describe("テンプレートディレクトリ展開 snapshot", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-snapshot-"));
    const snippetDir = path.join(tmpDir, "react-comp");
    fs.mkdirSync(snippetDir, { recursive: true });
    fs.mkdirSync(path.join(snippetDir, "{{ name }}"), { recursive: true });
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}", "index.tsx"),
      `import React from "react";

export interface {{ name }}Props {
  className?: string;
}

export const {{ name }}: React.FC<{{ name }}Props> = ({ className }) => {
  return <div className={className}>{{ name }}</div>;
};
`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(snippetDir, "{{ name }}", "{{ name }}.test.tsx"),
      `import { render, screen } from "@testing-library/react";
import { {{ name }} } from "./";

describe("{{ name }}", () => {
  it("renders correctly", () => {
    render(<{{ name }} />);
    expect(screen.getByText("{{ name }}")).toBeInTheDocument();
  });
});
`,
      "utf-8",
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("コンポーネント snippet 展開", () => {
    const result = expandTemplateDirectory(tmpDir, "react-comp", {
      name: "Button",
    });
    const snapshot: Record<string, string> = {};
    for (const [filePath, content] of result) {
      snapshot[filePath] = content;
    }
    expect(snapshot).toMatchSnapshot();
  });
});
