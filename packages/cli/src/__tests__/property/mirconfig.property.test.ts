import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import {
  mergeConfigs,
  loadSingleConfig,
  saveRegistryToken,
  removeRegistryToken,
  type MirConfig,
  type RegistryEntry,
} from "../../lib/mirconfig.js";

const registryEntryArb: fc.Arbitrary<RegistryEntry> = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  path: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

const mirConfigArb: fc.Arbitrary<MirConfig> = fc.record({
  registries: fc.array(registryEntryArb, { minLength: 0, maxLength: 5 }),
  defaults: fc.option(
    fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ minLength: 1, maxLength: 20 }), {
      minKeys: 0,
      maxKeys: 3,
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

  it("ローカルに存在する名前付き registry はグローバルから除外される", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, (local, global) => {
        const result = mergeConfigs(local, global);
        const localNames = new Set(
          local.registries.filter((r) => r.name).map((r) => r.name),
        );
        // ローカル部分の後に続くグローバル部分に、ローカルと同名の registry がないことを確認
        const globalPart = result.registries.slice(local.registries.length);
        for (const r of globalPart) {
          if (r.name && localNames.has(r.name)) {
            return false;
          }
        }
        return true;
      }),
    );
  });

  it("defaults は local が global を上書き", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ minLength: 1, maxLength: 20 })),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ minLength: 1, maxLength: 20 })),
        (localDefaults, globalDefaults) => {
          const local: MirConfig = {
            registries: [],
            defaults: localDefaults,
          };
          const global: MirConfig = {
            registries: [],
            defaults: globalDefaults,
          };
          const result = mergeConfigs(local, global);
          // local が global を上書きすることを確認
          for (const [key, value] of Object.entries(localDefaults)) {
            expect(result.defaults?.[key]).toBe(value);
          }
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

describe("3段階マージ property-based", () => {
  it("localPersonal の registries は常に結果の先頭にある", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, mirConfigArb, (global, local, personal) => {
        const merged = mergeConfigs(personal, mergeConfigs(local, global));
        for (let i = 0; i < personal.registries.length; i++) {
          expect(merged.registries[i]).toEqual(personal.registries[i]);
        }
      }),
    );
  });

  it("localPersonal の同名 registry は local/global の同名を排除する", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, mirConfigArb, (global, local, personal) => {
        const merged = mergeConfigs(personal, mergeConfigs(local, global));
        const personalNames = new Set(
          personal.registries.filter((r) => r.name).map((r) => r.name),
        );
        const rest = merged.registries.slice(personal.registries.length);
        for (const r of rest) {
          if (r.name && personalNames.has(r.name)) {
            return false;
          }
        }
        return true;
      }),
    );
  });

  it("localPersonal の locale は常に最終結果に反映される（undefined でない限り）", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, mirConfigArb, (global, local, personal) => {
        const merged = mergeConfigs(personal, mergeConfigs(local, global));
        if (personal.locale !== undefined) {
          expect(merged.locale).toBe(personal.locale);
        }
      }),
    );
  });

  it("localPersonal の defaults の各キーは常に最終結果に反映される", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, mirConfigArb, (global, local, personal) => {
        const merged = mergeConfigs(personal, mergeConfigs(local, global));
        if (personal.defaults) {
          for (const [key, value] of Object.entries(personal.defaults)) {
            expect(merged.defaults?.[key]).toBe(value);
          }
        }
      }),
    );
  });

  it("registries 数 ≤ 3つの config の registries 数の合計", () => {
    fc.assert(
      fc.property(mirConfigArb, mirConfigArb, mirConfigArb, (global, local, personal) => {
        const merged = mergeConfigs(personal, mergeConfigs(local, global));
        const totalInput =
          global.registries.length + local.registries.length + personal.registries.length;
        expect(merged.registries.length).toBeLessThanOrEqual(totalInput);
      }),
    );
  });

  it("冪等性: 同一 config を2回マージしても重複名前付き registry がない", () => {
    fc.assert(
      fc.property(mirConfigArb, (config) => {
        const merged = mergeConfigs(config, config);
        const namedRegistries = merged.registries.filter((r) => r.name);
        const names = namedRegistries.map((r) => r.name);
        const uniqueNames = new Set(names);
        expect(names.length).toBe(uniqueNames.size);
      }),
    );
  });
});

describe("saveRegistryToken / removeRegistryToken property-based", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mir-pbt-token-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const registryNameArb = fc.string({ minLength: 1, maxLength: 20, unit: "grapheme" })
    .filter((s) => !s.includes("\n") && !s.includes("\r") && s.trim().length > 0);
  const tokenArb = fc.string({ minLength: 1, maxLength: 50, unit: "grapheme" })
    .filter((s) => !s.includes("\n") && !s.includes("\r") && s.trim().length > 0);

  it("save → load で token が一致する", () => {
    fc.assert(
      fc.property(registryNameArb, tokenArb, (name, token) => {
        const configPath = path.join(tmpDir, `config-${Date.now()}-${Math.random()}.yaml`);
        saveRegistryToken(name, token, configPath);
        const config = loadSingleConfig(configPath);
        const entry = config.registries.find((r) => r.name === name);
        expect(entry?.publish_token).toBe(token);
      }),
      { numRuns: 30 },
    );
  });

  it("save → remove の往復で token が消える", () => {
    fc.assert(
      fc.property(registryNameArb, tokenArb, (name, token) => {
        const configPath = path.join(tmpDir, `config-${Date.now()}-${Math.random()}.yaml`);
        saveRegistryToken(name, token, configPath);
        removeRegistryToken(name, configPath);
        const config = loadSingleConfig(configPath);
        const entry = config.registries.find((r) => r.name === name);
        expect(entry?.publish_token).toBeUndefined();
      }),
      { numRuns: 30 },
    );
  });

  it("同じ registry に2回 save → 最後の token が残り重複エントリなし", () => {
    fc.assert(
      fc.property(registryNameArb, tokenArb, tokenArb, (name, token1, token2) => {
        const configPath = path.join(tmpDir, `config-${Date.now()}-${Math.random()}.yaml`);
        saveRegistryToken(name, token1, configPath);
        saveRegistryToken(name, token2, configPath);
        const config = loadSingleConfig(configPath);
        const entries = config.registries.filter((r) => r.name === name);
        expect(entries).toHaveLength(1);
        expect(entries[0].publish_token).toBe(token2);
      }),
      { numRuns: 30 },
    );
  });

  it("ローカル個人 config に token 保存 → 3段階マージで反映される", () => {
    fc.assert(
      fc.property(registryNameArb, tokenArb, (name, token) => {
        const configPath = path.join(tmpDir, `config-${Date.now()}-${Math.random()}.yaml`);
        saveRegistryToken(name, token, configPath);
        const personal = loadSingleConfig(configPath);
        const global: MirConfig = { registries: [{ name, url: "https://example.com" }] };
        const local: MirConfig = { registries: [] };
        const merged = mergeConfigs(personal, mergeConfigs(local, global));
        const entry = merged.registries.find((r) => r.name === name);
        expect(entry?.publish_token).toBe(token);
      }),
      { numRuns: 30 },
    );
  });
});
