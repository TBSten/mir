import { describe, it, expect } from "vitest";
import { createRegistryRoutes } from "../routes.js";
import type {
  AuthorizationStatus,
  RegistryProvider,
  RegistrySnippetSummary,
  RegistrySnippetDetail,
} from "../types.js";

function createMockProvider(
  summaries: RegistrySnippetSummary[],
  details: Record<string, RegistrySnippetDetail | null>,
): RegistryProvider {
  return {
    async list() {
      return summaries;
    },
    async get(name) {
      return details[name] ?? null;
    },
  };
}

function makeDetail(
  name: string,
  authorizationStatus?: AuthorizationStatus,
): RegistrySnippetDetail {
  return {
    definition: { name },
    files: new Map([["index.ts", `// ${name}`]]),
    authorizationStatus,
  };
}

describe("GET /api/snippets/:name - authorizationStatus", () => {
  const statuses: AuthorizationStatus[] = ["examination", "approved", "rejected"];

  for (const status of statuses) {
    it(`authorizationStatus="${status}" がレスポンスに含まれる`, async () => {
      const provider = createMockProvider(
        [{ name: "test", authorizationStatus: status }],
        { test: makeDetail("test", status) },
      );
      const app = createRegistryRoutes(provider);
      const res = await app.request("/api/snippets/test");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authorizationStatus).toBe(status);
    });
  }

  it("authorizationStatus が undefined の場合はフィールドが undefined", async () => {
    const provider = createMockProvider(
      [{ name: "test" }],
      { test: makeDetail("test", undefined) },
    );
    const app = createRegistryRoutes(provider);
    const res = await app.request("/api/snippets/test");
    const data = await res.json();
    expect(data.authorizationStatus).toBeUndefined();
  });

  it("存在しない snippet は 404", async () => {
    const provider = createMockProvider([], {});
    const app = createRegistryRoutes(provider);
    const res = await app.request("/api/snippets/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/snippets - 一覧の authorizationStatus", () => {
  it("各 snippet の authorizationStatus がリスト結果に反映される", async () => {
    const summaries: RegistrySnippetSummary[] = [
      { name: "approved-one", authorizationStatus: "approved" },
      { name: "exam-one", authorizationStatus: "examination" },
      { name: "rejected-one", authorizationStatus: "rejected" },
      { name: "no-status" },
    ];
    const provider = createMockProvider(summaries, {});
    const app = createRegistryRoutes(provider);
    const res = await app.request("/api/snippets");
    const data = await res.json();

    expect(data.items).toHaveLength(4);
    expect(data.items[0].authorizationStatus).toBe("approved");
    expect(data.items[1].authorizationStatus).toBe("examination");
    expect(data.items[2].authorizationStatus).toBe("rejected");
    expect(data.items[3].authorizationStatus).toBeUndefined();
  });
});

describe("GET /api/snippets/:name レスポンス構造スナップショット", () => {
  it("approved snippet のレスポンス構造", async () => {
    const detail: RegistrySnippetDetail = {
      definition: {
        name: "my-hook",
        description: "A custom hook",
        version: "1.0.0",
        variables: { name: { schema: { type: "string" } } },
      },
      files: new Map([
        ["{{ name }}.ts", "export function {{ name }}() {}"],
        ["{{ name }}.test.ts", "test('{{ name }}', () => {});"],
      ]),
      authorizationStatus: "approved",
    };
    const provider = createMockProvider(
      [{ name: "my-hook", authorizationStatus: "approved" }],
      { "my-hook": detail },
    );
    const app = createRegistryRoutes(provider);
    const res = await app.request("/api/snippets/my-hook");
    const data = await res.json();

    expect(data).toMatchSnapshot();
  });

  it("examination snippet のレスポンス構造", async () => {
    const provider = createMockProvider(
      [{ name: "untrusted", authorizationStatus: "examination" }],
      { untrusted: makeDetail("untrusted", "examination") },
    );
    const app = createRegistryRoutes(provider);
    const res = await app.request("/api/snippets/untrusted");
    const data = await res.json();

    expect(data).toMatchSnapshot();
  });

  it("rejected snippet のレスポンス構造", async () => {
    const provider = createMockProvider(
      [{ name: "bad-snippet", authorizationStatus: "rejected" }],
      { "bad-snippet": makeDetail("bad-snippet", "rejected") },
    );
    const app = createRegistryRoutes(provider);
    const res = await app.request("/api/snippets/bad-snippet");
    const data = await res.json();

    expect(data).toMatchSnapshot();
  });
});
