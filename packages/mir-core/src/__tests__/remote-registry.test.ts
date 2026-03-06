import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchRegistryManifest,
  listRemoteSnippets,
  fetchSnippetDefinition,
  fetchRemoteFiles,
  fetchRemoteSnippet,
  expandRemoteTemplateFiles,
} from "../remote-registry.js";
import { RemoteRegistryFetchError, InvalidManifestError } from "../errors.js";

const BASE_URL = "https://example.com/registry";

const validManifest = {
  snippets: {
    "react-hook": { files: ["{{ name }}.ts", "{{ name }}.test.ts"] },
    "express-api": { files: ["index.ts"] },
  },
};

const reactHookYaml = `
name: react-hook
description: React カスタムフック雛形
variables:
  name:
    description: フック名
    schema:
      type: string
`;

function mockFetch(handlers: Record<string, { status: number; body: string }>) {
  return vi.fn(async (url: string) => {
    const handler = handlers[url];
    if (!handler) {
      return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
    }
    return {
      ok: handler.status >= 200 && handler.status < 300,
      status: handler.status,
      json: async () => JSON.parse(handler.body),
      text: async () => handler.body,
    };
  }) as unknown as typeof globalThis.fetch;
}

describe("fetchRegistryManifest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("正常なマニフェストを取得できる", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify(validManifest),
        },
      }),
    );
    const manifest = await fetchRegistryManifest(BASE_URL);
    expect(manifest.snippets).toHaveProperty("react-hook");
    expect(manifest.snippets["react-hook"].files).toHaveLength(2);
  });

  it("末尾スラッシュ付き URL でも取得できる", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify(validManifest),
        },
      }),
    );
    const manifest = await fetchRegistryManifest(`${BASE_URL}/`);
    expect(manifest.snippets).toHaveProperty("react-hook");
  });

  it("HTTP エラーで RemoteRegistryFetchError", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: { status: 500, body: "error" },
      }),
    );
    await expect(fetchRegistryManifest(BASE_URL)).rejects.toThrow(
      RemoteRegistryFetchError,
    );
  });

  it("ネットワークエラーで RemoteRegistryFetchError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }) as unknown as typeof globalThis.fetch,
    );
    await expect(fetchRegistryManifest(BASE_URL)).rejects.toThrow(
      RemoteRegistryFetchError,
    );
  });

  it("不正なマニフェストで InvalidManifestError", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify({ invalid: true }),
        },
      }),
    );
    await expect(fetchRegistryManifest(BASE_URL)).rejects.toThrow(
      InvalidManifestError,
    );
  });
});

describe("listRemoteSnippets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("snippet 名一覧を返す", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify(validManifest),
        },
      }),
    );
    const names = await listRemoteSnippets(BASE_URL);
    expect(names).toEqual(["react-hook", "express-api"]);
  });
});

describe("fetchSnippetDefinition", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("YAML を parse して SnippetDefinition を返す", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/react-hook.yaml`]: {
          status: 200,
          body: reactHookYaml,
        },
      }),
    );
    const def = await fetchSnippetDefinition(BASE_URL, "react-hook");
    expect(def.name).toBe("react-hook");
    expect(def.variables).toHaveProperty("name");
  });

  it("404 で RemoteRegistryFetchError", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    await expect(
      fetchSnippetDefinition(BASE_URL, "nonexistent"),
    ).rejects.toThrow(RemoteRegistryFetchError);
  });
});

describe("fetchRemoteFiles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("テンプレートファイルを並列取得する", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/react-hook/${encodeURIComponent("{{ name }}.ts")}`]: {
          status: 200,
          body: "export function {{ name }}() {}",
        },
        [`${BASE_URL}/react-hook/${encodeURIComponent("{{ name }}.test.ts")}`]:
          {
            status: 200,
            body: 'test("{{ name }}", () => {});',
          },
      }),
    );
    const files = await fetchRemoteFiles(BASE_URL, "react-hook", [
      "{{ name }}.ts",
      "{{ name }}.test.ts",
    ]);
    expect(files.size).toBe(2);
    expect(files.get("{{ name }}.ts")).toContain("{{ name }}");
  });
});

describe("fetchRemoteSnippet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("definition + files を統合して返す", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify(validManifest),
        },
        [`${BASE_URL}/react-hook.yaml`]: {
          status: 200,
          body: reactHookYaml,
        },
        [`${BASE_URL}/react-hook/${encodeURIComponent("{{ name }}.ts")}`]: {
          status: 200,
          body: "export function {{ name }}() {}",
        },
        [`${BASE_URL}/react-hook/${encodeURIComponent("{{ name }}.test.ts")}`]:
          {
            status: 200,
            body: 'test("{{ name }}", () => {});',
          },
      }),
    );
    const snippet = await fetchRemoteSnippet(BASE_URL, "react-hook");
    expect(snippet.definition.name).toBe("react-hook");
    expect(snippet.files.size).toBe(2);
  });

  it("マニフェストに存在しない snippet は 404 エラー", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify(validManifest),
        },
      }),
    );
    await expect(
      fetchRemoteSnippet(BASE_URL, "nonexistent"),
    ).rejects.toThrow(RemoteRegistryFetchError);
  });
});

describe("expandRemoteTemplateFiles", () => {
  it("ファイルパスと内容の変数を展開する", () => {
    const files = new Map([
      ["{{ name }}.ts", "export function {{ name }}() {}"],
      ["{{ name }}.test.ts", 'test("{{ name }}", () => {});'],
    ]);
    const expanded = expandRemoteTemplateFiles(files, { name: "useAuth" });
    expect(expanded.has("useAuth.ts")).toBe(true);
    expect(expanded.get("useAuth.ts")).toBe("export function useAuth() {}");
    expect(expanded.has("useAuth.test.ts")).toBe(true);
  });

  it("変数が空の場合もそのまま展開する", () => {
    const files = new Map([["index.ts", "console.log('hello');"]]);
    const expanded = expandRemoteTemplateFiles(files, {});
    expect(expanded.get("index.ts")).toBe("console.log('hello');");
  });
});
