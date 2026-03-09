import { describe, it, expect, vi, afterEach } from "vitest";
import fc from "fast-check";
import {
  fetchRegistryManifest,
  fetchRemoteSnippet,
  clearAllRemoteRegistryCaches,
} from "../remote-registry.js";
import type { AuthorizationStatus } from "../remote-registry.js";

const BASE_URL = "https://example.com/registry";

const reactHookYaml = `
name: react-hook
variables:
  name:
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

afterEach(() => {
  vi.restoreAllMocks();
  clearAllRemoteRegistryCaches();
});

describe("fetchRegistryManifest: authorizationStatus (PBT)", () => {
  const authStatusArb: fc.Arbitrary<AuthorizationStatus> = fc.constantFrom(
    "examination" as const,
    "approved" as const,
    "rejected" as const,
  );

  it("マニフェスト内の各 snippet の authorizationStatus が保存される", async () => {
    await fc.assert(
      fc.asyncProperty(
        authStatusArb,
        authStatusArb,
        async (status1, status2) => {
          clearAllRemoteRegistryCaches();
          const manifest = {
            snippets: {
              "snippet-a": { files: ["index.ts"], authorizationStatus: status1 },
              "snippet-b": { files: ["main.ts"], authorizationStatus: status2 },
            },
          };

          vi.stubGlobal(
            "fetch",
            mockFetch({
              [`${BASE_URL}/index.json`]: {
                status: 200,
                body: JSON.stringify(manifest),
              },
            }),
          );

          const result = await fetchRegistryManifest(BASE_URL);
          expect(result.snippets["snippet-a"].authorizationStatus).toBe(status1);
          expect(result.snippets["snippet-b"].authorizationStatus).toBe(status2);
        },
      ),
      { numRuns: 9 }, // 3x3 の全組み合わせをカバー
    );
  });

  it("authorizationStatus が未指定の snippet は undefined", async () => {
    clearAllRemoteRegistryCaches();
    const manifest = {
      snippets: {
        "no-auth": { files: ["index.ts"] },
      },
    };

    vi.stubGlobal(
      "fetch",
      mockFetch({
        [`${BASE_URL}/index.json`]: {
          status: 200,
          body: JSON.stringify(manifest),
        },
      }),
    );

    const result = await fetchRegistryManifest(BASE_URL);
    expect(result.snippets["no-auth"].authorizationStatus).toBeUndefined();
  });
});

describe("fetchRemoteSnippet: authorizationStatus (PBT)", () => {
  const authStatusArb: fc.Arbitrary<AuthorizationStatus | undefined> = fc.option(
    fc.constantFrom("examination" as const, "approved" as const, "rejected" as const),
    { nil: undefined },
  );

  it("fetchRemoteSnippet は authorizationStatus をそのまま返す", async () => {
    await fc.assert(
      fc.asyncProperty(authStatusArb, async (status) => {
        clearAllRemoteRegistryCaches();
        const manifest = {
          snippets: {
            "react-hook": {
              files: ["{{ name }}.ts"],
              ...(status !== undefined ? { authorizationStatus: status } : {}),
            },
          },
        };

        vi.stubGlobal(
          "fetch",
          mockFetch({
            [`${BASE_URL}/index.json`]: {
              status: 200,
              body: JSON.stringify(manifest),
            },
            [`${BASE_URL}/react-hook.yaml`]: {
              status: 200,
              body: reactHookYaml,
            },
            [`${BASE_URL}/react-hook/${encodeURIComponent("{{ name }}.ts")}`]: {
              status: 200,
              body: "export function {{ name }}() {}",
            },
          }),
        );

        const snippet = await fetchRemoteSnippet(BASE_URL, "react-hook");

        if (status !== undefined) {
          expect(snippet.authorizationStatus).toBe(status);
        } else {
          expect(snippet.authorizationStatus).toBeUndefined();
        }
      }),
      { numRuns: 10 },
    );
  });
});

describe("authorizationStatus スナップショット", () => {
  const statuses: Array<AuthorizationStatus | undefined> = [
    "approved",
    "examination",
    "rejected",
    undefined,
  ];

  for (const status of statuses) {
    it(`マニフェスト構造 (status=${status})`, async () => {
      clearAllRemoteRegistryCaches();
      const snippetEntry: Record<string, unknown> = { files: ["index.ts"] };
      if (status !== undefined) {
        snippetEntry.authorizationStatus = status;
      }
      const manifest = { snippets: { "test-snippet": snippetEntry } };

      vi.stubGlobal(
        "fetch",
        mockFetch({
          [`${BASE_URL}/index.json`]: {
            status: 200,
            body: JSON.stringify(manifest),
          },
        }),
      );

      const result = await fetchRegistryManifest(BASE_URL);
      expect(result.snippets["test-snippet"]).toMatchSnapshot();
    });
  }
});
