import type {
  RegistryProvider,
  RegistrySnippetDetail,
  RegistrySnippetSummary,
  SnippetVersionEntry,
} from "@tbsten/mir-registry-sdk";

const snippets: RegistrySnippetDetail[] = [
  {
    definition: {
      name: "react-hook",
      version: "1.2.0",
      description: "A set of useful React hooks for common tasks",
      tags: ["react", "hooks", "typescript"],
      variables: {},
    },
    files: new Map([
      [
        "use-debounce.ts",
        `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}`,
      ],
      [
        "use-local-storage.ts",
        `import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });
  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };
  return [storedValue, setValue] as const;
}`,
      ],
      [
        "index.ts",
        `export { useDebounce } from "./use-debounce";\nexport { useLocalStorage } from "./use-local-storage";\n`,
      ],
    ]),
  },
  {
    definition: {
      name: "react-component",
      version: "1.1.0",
      description: "React component boilerplate with TypeScript",
      tags: ["react", "component", "typescript"],
      dependencies: ["react-hook"],
      variables: {
        name: {
          description: "Component name",
          schema: { type: "string" as const },
        },
      },
    },
    files: new Map([
      [
        "{{ name }}.tsx",
        `export interface {{ name }}Props {
  children?: React.ReactNode;
}

export function {{ name }}({ children }: {{ name }}Props) {
  return <div>{children}</div>;
}`,
      ],
      [
        "{{ name }}.test.tsx",
        `import { render, screen } from "@testing-library/react";
import { {{ name }} } from "./{{ name }}";

test("renders children", () => {
  render(<{{ name }}>Hello</{{ name }}>);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});`,
      ],
    ]),
  },
  {
    definition: {
      name: "express-router",
      version: "2.0.0",
      description: "Express router with CRUD endpoints",
      tags: ["express", "api", "typescript"],
      variables: {
        name: {
          description: "Resource name",
          schema: { type: "string" as const },
        },
        method: {
          description: "HTTP method",
          schema: { type: "string" as const, default: "get" },
        },
      },
    },
    files: new Map([
      [
        "{{ name }}.router.ts",
        `import { Router } from "express";

const router = Router();

router.{{ method }}("/{{ name }}", (req, res) => {
  res.json({ message: "{{ name }} endpoint" });
});

router.{{ method }}("/{{ name }}/:id", (req, res) => {
  res.json({ id: req.params.id });
});

export default router;`,
      ],
      [
        "{{ name }}.router.test.ts",
        `import request from "supertest";
import express from "express";
import router from "./{{ name }}.router";

const app = express();
app.use(router);

test("{{ method }} /{{ name }}", async () => {
  const res = await request(app).{{ method }}("/{{ name }}");
  expect(res.status).toBe(200);
});`,
      ],
    ]),
  },
  {
    definition: {
      name: "nextjs-page",
      version: "1.0.0",
      description: "Next.js App Router page with layout",
      tags: ["nextjs", "react", "typescript"],
      dependencies: ["react-hook"],
      variables: {
        name: {
          description: "Page name (used as route segment)",
          schema: { type: "string" as const },
        },
      },
    },
    files: new Map([
      [
        "{{ name }}/page.tsx",
        `export default function {{ name }}Page() {
  return (
    <main>
      <h1>{{ name }}</h1>
    </main>
  );
}`,
      ],
      [
        "{{ name }}/layout.tsx",
        `export default function {{ name }}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}`,
      ],
      [
        "{{ name }}/loading.tsx",
        `export default function {{ name }}Loading() {
  return <div>Loading...</div>;
}`,
      ],
    ]),
  },
  {
    definition: {
      name: "vitest-setup",
      version: "1.0.0",
      description: "Vitest configuration and test utilities",
      tags: ["vitest", "testing", "typescript"],
      variables: {},
    },
    files: new Map([
      [
        "vitest.config.ts",
        `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});`,
      ],
      [
        "test/setup.ts",
        `// Global test setup
// Add any global mocks or configuration here

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});`,
      ],
    ]),
  },
];

/**
 * snippet ごとのバージョン履歴（静的データ）
 * 実際の運用では KV や D1 に格納することを想定
 */
const versionHistories: Record<string, SnippetVersionEntry[]> = {
  "react-hook": [
    { version: "1.2.0", publishedAt: "2026-03-01", description: "Add useDebounce hook" },
    { version: "1.1.0", publishedAt: "2026-02-01", description: "Add useLocalStorage hook" },
    { version: "1.0.0", publishedAt: "2026-01-01", description: "Initial release" },
  ],
  "react-component": [
    { version: "1.1.0", publishedAt: "2026-02-15", description: "Add test file template" },
    { version: "1.0.0", publishedAt: "2026-01-15", description: "Initial release" },
  ],
  "express-router": [
    { version: "2.0.0", publishedAt: "2026-02-20", description: "Add CRUD test template" },
    { version: "1.0.0", publishedAt: "2026-01-10", description: "Initial release" },
  ],
  "nextjs-page": [
    { version: "1.0.0", publishedAt: "2026-01-20", description: "Initial release" },
  ],
  "vitest-setup": [
    { version: "1.0.0", publishedAt: "2026-01-05", description: "Initial release" },
  ],
};

// Dev environment: empty snippets list by default
const summaries: RegistrySnippetSummary[] = [];

export const staticProvider: RegistryProvider = {
  async list() {
    return summaries;
  },
  async get(name) {
    return snippets.find((s) => s.definition.name === name) ?? null;
  },
  async search(query) {
    const q = query.toLowerCase();
    return summaries.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false),
    );
  },
  async getVersionHistory(name) {
    const snippet = snippets.find((s) => s.definition.name === name);
    if (!snippet) return null;
    return versionHistories[name] ?? [];
  },
  async getDependencies(name) {
    const snippet = snippets.find((s) => s.definition.name === name);
    return snippet?.definition.dependencies ?? [];
  },
  async getTransitiveDependencies(name) {
    const visited = new Set<string>();
    const queue: string[] = [name];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const snippet = snippets.find((s) => s.definition.name === current);
      const deps = snippet?.definition.dependencies ?? [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }

    // 自分自身を除いた結果を返す
    visited.delete(name);
    return Array.from(visited);
  },
};
