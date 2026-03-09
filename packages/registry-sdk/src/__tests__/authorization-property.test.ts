import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createStaticProtocolRoutes } from "../static-routes.js";
import { createRegistryRoutes } from "../routes.js";
import type {
  AuthorizationStatus,
  RegistryProvider,
  RegistrySnippetSummary,
  RegistrySnippetDetail,
} from "../types.js";

const authorizationStatusArb: fc.Arbitrary<AuthorizationStatus> = fc.constantFrom(
  "examination" as const,
  "approved" as const,
  "rejected" as const,
);

const optionalAuthStatusArb: fc.Arbitrary<AuthorizationStatus | undefined> = fc.option(
  authorizationStatusArb,
  { nil: undefined },
);

const snippetNameArb = fc.string({ minLength: 1, maxLength: 30 })
  .filter((s) => /^[a-z][a-z0-9-]*$/.test(s));

describe("AuthorizationStatus 型の網羅性 (PBT)", () => {
  it("AuthorizationStatus は 3 値のいずれかのみ", () => {
    fc.assert(
      fc.property(authorizationStatusArb, (status) => {
        expect(["examination", "approved", "rejected"]).toContain(status);
      }),
      { numRuns: 15 },
    );
  });

  it("optional AuthorizationStatus は undefined または 3 値のいずれか", () => {
    fc.assert(
      fc.property(optionalAuthStatusArb, (status) => {
        if (status !== undefined) {
          expect(["examination", "approved", "rejected"]).toContain(status);
        }
      }),
      { numRuns: 15 },
    );
  });
});

describe("static-routes: authorizationStatus の保存性 (PBT)", () => {
  it("provider の authorizationStatus がマニフェストにそのまま反映される", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: snippetNameArb,
            status: optionalAuthStatusArb,
          }),
          { minLength: 1, maxLength: 5 },
        ),
        async (entries) => {
          const uniqueEntries = entries.filter(
            (e, i, arr) => arr.findIndex((x) => x.name === e.name) === i,
          );

          const summaries: RegistrySnippetSummary[] = uniqueEntries.map((e) => ({
            name: e.name,
            authorizationStatus: e.status,
          }));

          const details: Record<string, RegistrySnippetDetail> = {};
          for (const e of uniqueEntries) {
            details[e.name] = {
              definition: { name: e.name },
              files: new Map([["index.ts", `// ${e.name}`]]),
              authorizationStatus: e.status,
            };
          }

          const provider: RegistryProvider = {
            async list() { return summaries; },
            async get(name) { return details[name] ?? null; },
          };

          const app = createStaticProtocolRoutes(provider);
          const res = await app.request("/index.json");
          const data = await res.json();

          for (const e of uniqueEntries) {
            const snippetData = data.snippets[e.name];
            expect(snippetData).toBeDefined();
            if (e.status !== undefined) {
              expect(snippetData.authorizationStatus).toBe(e.status);
            } else {
              expect(snippetData.authorizationStatus).toBeUndefined();
            }
          }
        },
      ),
      { numRuns: 10 },
    );
  });
});

describe("routes API: authorizationStatus の保存性 (PBT)", () => {
  it("GET /api/snippets/:name は provider の authorizationStatus をそのまま返す", async () => {
    await fc.assert(
      fc.asyncProperty(snippetNameArb, optionalAuthStatusArb, async (name, status) => {
        const detail: RegistrySnippetDetail = {
          definition: { name },
          files: new Map([["index.ts", "// x"]]),
          authorizationStatus: status,
        };
        const provider: RegistryProvider = {
          async list() { return [{ name, authorizationStatus: status }]; },
          async get(n) { return n === name ? detail : null; },
        };

        const app = createRegistryRoutes(provider);
        const res = await app.request(`/api/snippets/${encodeURIComponent(name)}`);
        const data = await res.json();

        if (status !== undefined) {
          expect(data.authorizationStatus).toBe(status);
        } else {
          expect(data.authorizationStatus).toBeUndefined();
        }
      }),
      { numRuns: 15 },
    );
  });

  it("GET /api/snippets 一覧は各 snippet の authorizationStatus を保存する", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: snippetNameArb,
            status: optionalAuthStatusArb,
          }),
          { minLength: 1, maxLength: 5 },
        ),
        async (entries) => {
          const uniqueEntries = entries.filter(
            (e, i, arr) => arr.findIndex((x) => x.name === e.name) === i,
          );

          const summaries: RegistrySnippetSummary[] = uniqueEntries.map((e) => ({
            name: e.name,
            authorizationStatus: e.status,
          }));

          const provider: RegistryProvider = {
            async list() { return summaries; },
            async get() { return null; },
          };

          const app = createRegistryRoutes(provider);
          const res = await app.request("/api/snippets");
          const data = await res.json();

          expect(data.items).toHaveLength(uniqueEntries.length);
          for (let i = 0; i < uniqueEntries.length; i++) {
            const expected = uniqueEntries[i].status;
            if (expected !== undefined) {
              expect(data.items[i].authorizationStatus).toBe(expected);
            } else {
              expect(data.items[i].authorizationStatus).toBeUndefined();
            }
          }
        },
      ),
      { numRuns: 10 },
    );
  });
});

describe("認可ステータスの不変条件 (PBT)", () => {
  it("approved スニペットは常にインストール安全", () => {
    fc.assert(
      fc.property(snippetNameArb, () => {
        const status: AuthorizationStatus = "approved";
        const needsWarning = status !== "approved";
        expect(needsWarning).toBe(false);
      }),
      { numRuns: 15 },
    );
  });

  it("examination/rejected は常に警告必要", () => {
    fc.assert(
      fc.property(
        snippetNameArb,
        fc.constantFrom("examination" as const, "rejected" as const),
        (_name, status) => {
          const needsWarning = status !== "approved";
          expect(needsWarning).toBe(true);
        },
      ),
      { numRuns: 15 },
    );
  });

  it("undefined ステータスは警告不要 (ローカル registry 等)", () => {
    fc.assert(
      fc.property(snippetNameArb, () => {
        const status: AuthorizationStatus | undefined = undefined;
        const needsWarning = status !== undefined && status !== "approved";
        expect(needsWarning).toBe(false);
      }),
      { numRuns: 15 },
    );
  });
});
