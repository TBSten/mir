import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { mergeConfigs, type MirConfig, type RegistryEntry } from "../../lib/mirconfig.js";

const registryEntryArb: fc.Arbitrary<RegistryEntry> = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  path: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

const mirConfigArb: fc.Arbitrary<MirConfig> = fc.record({
  registries: fc.array(registryEntryArb, { minLength: 0, maxLength: 5 }),
  defaults: fc.option(
    fc.record({
      author: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
    }),
    { nil: undefined },
  ),
  locale: fc.option(fc.constantFrom("ja" as const, "en" as const), { nil: undefined }),
});

const emptyConfig: MirConfig = { registries: [] };

describe("mergeConfigs property-based", () => {
  it("ローカルのみ → global 空でマージするとローカルがそのまま返る", () => {
    fc.assert(
      fc.property(mirConfigArb, (local) => {
        const result = mergeConfigs(local, emptyConfig);
        // registries はローカルがそのまま入る
        expect(result.registries.slice(0, local.registries.length)).toEqual(
          local.registries,
        );
        // locale はローカルのまま
        expect(result.locale).toBe(local.locale);
      }),
    );
  });

  it("グローバルのみ → local 空でマージするとグローバルがそのまま返る", () => {
    fc.assert(
      fc.property(mirConfigArb, (global) => {
        const result = mergeConfigs(emptyConfig, global);
        // registries はグローバルがそのまま入る
        expect(result.registries).toEqual(global.registries);
        // locale はグローバルのまま
        expect(result.locale).toBe(global.locale);
      }),
    );
  });

  it("同名 registry はローカル優先 (結果内に同名 registry が複数存在しない)", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, (local, global) => {
        const result = mergeConfigs(local, global);
        const namedRegistries = result.registries.filter((r) => r.name);
        const names = namedRegistries.map((r) => r.name);
        const uniqueNames = new Set(names);
        expect(names.length).toBe(uniqueNames.size);
      }),
    );
  });

  it("defaults は local が global を上書き", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (localAuthor, globalAuthor) => {
          const local: MirConfig = {
            registries: [],
            defaults: { author: localAuthor },
          };
          const global: MirConfig = {
            registries: [],
            defaults: { author: globalAuthor },
          };
          const result = mergeConfigs(local, global);
          expect(result.defaults?.author).toBe(localAuthor);
        },
      ),
    );
  });

  it("locale は local ?? global", () => {
    fc.assert(
      fc.property(
        fc.option(fc.constantFrom("ja" as const, "en" as const), { nil: undefined }),
        fc.option(fc.constantFrom("ja" as const, "en" as const), { nil: undefined }),
        (localLocale, globalLocale) => {
          const local: MirConfig = { registries: [], locale: localLocale };
          const global: MirConfig = { registries: [], locale: globalLocale };
          const result = mergeConfigs(local, global);
          expect(result.locale).toBe(localLocale ?? globalLocale);
        },
      ),
    );
  });
});
