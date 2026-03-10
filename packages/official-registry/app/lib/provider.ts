import type {
  RegistryProvider,
  RegistrySnippetSummary,
  RegistrySnippetDetail,
  SnippetVersionEntry,
} from "@tbsten/mir-registry-sdk";

interface SnippetData {
  name: string;
  version: string;
  description: string;
  variables?: Record<string, { description: string; schema: { type: string } }>;
  dependencies?: string[];
  files: Record<string, string>;
}

const snippets: SnippetData[] = [
  {
    name: "react-hook",
    version: "1.0.0",
    description: "React カスタムフック雛形",
    variables: {
      name: { description: "フック名", schema: { type: "string" } },
    },
    files: {
      "{{ name }}.ts": 'export function {{ name }}() { return null; }',
      "{{ name }}.test.ts": 'import { {{ name }} } from "./{{ name }}";\ntest("works", () => {});',
    },
  },
  {
    name: "react-component",
    version: "1.0.0",
    description: "React component boilerplate",
    variables: {
      name: { description: "コンポーネント名", schema: { type: "string" } },
    },
    dependencies: ["react-hook"],
    files: {
      "{{ name }}.tsx": "<div>{{ name }}</div>",
    },
  },
  {
    name: "express-router",
    version: "1.0.0",
    description: "Express router テンプレート",
    files: {
      "index.ts": "import { Router } from 'express';",
    },
  },
  {
    name: "nextjs-page",
    version: "1.0.0",
    description: "Next.js ページテンプレート",
    dependencies: ["react-component"],
    files: {
      "page.tsx": "export default function Page() {}",
    },
  },
  {
    name: "vitest-setup",
    version: "1.0.0",
    description: "Vitest セットアップ",
    files: {
      "vitest.config.ts": "import { defineConfig } from 'vitest/config';",
    },
  },
];

/**
 * Static provider - デモ/テスト用のサンプルデータを含む
 * 本番環境では D1 provider がメインで使用される
 */
export const staticProvider: RegistryProvider = {
  async list(): Promise<RegistrySnippetSummary[]> {
    return snippets.map((s) => ({
      name: s.name,
      version: s.version,
      description: s.description,
    }));
  },

  async get(name: string): Promise<RegistrySnippetDetail | null> {
    const s = snippets.find((s) => s.name === name);
    if (!s) return null;
    return {
      definition: {
        name: s.name,
        version: s.version,
        description: s.description,
        variables: s.variables as any,
        dependencies: s.dependencies,
      },
      files: new Map(Object.entries(s.files)),
    };
  },

  async getVersionHistory(name: string): Promise<SnippetVersionEntry[] | null> {
    const s = snippets.find((s) => s.name === name);
    if (!s) return null;
    return [{ version: s.version, publishedAt: "2026-01-01" }];
  },

  async getDependencies(name: string): Promise<string[]> {
    const s = snippets.find((s) => s.name === name);
    return s?.dependencies ?? [];
  },

  async getTransitiveDependencies(name: string): Promise<string[]> {
    const visited = new Set<string>();
    const resolve = (n: string) => {
      const s = snippets.find((s) => s.name === n);
      if (!s?.dependencies) return;
      for (const dep of s.dependencies) {
        if (!visited.has(dep)) {
          visited.add(dep);
          resolve(dep);
        }
      }
    };
    resolve(name);
    return [...visited];
  },
};
