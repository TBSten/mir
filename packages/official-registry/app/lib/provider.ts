import type { RegistryProvider, RegistrySnippetDetail, RegistrySnippetSummary } from "@mir/registry-sdk";

// TODO: 将来的にファイルシステムやDBから読み込む
const snippets: RegistrySnippetDetail[] = [
  {
    definition: {
      name: "react-hook",
      description: "A set of useful React hooks for common tasks",
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
      ["index.ts", `export { useDebounce } from "./use-debounce";\nexport { useLocalStorage } from "./use-local-storage";\n`],
    ]),
  },
];

const summaries: RegistrySnippetSummary[] = snippets.map((s) => ({
  name: s.definition.name,
  description: s.definition.description,
}));

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
};
