import { describe, it, expect } from "vitest";
import { mergeConfigs, type MirConfig } from "../../lib/mirconfig.js";

describe("mergeConfigs snapshot", () => {
  it("ローカルのみ", () => {
    const local: MirConfig = {
      registries: [{ name: "local-reg", path: "~/my-registry" }],
      defaults: { author: "alice" },
      locale: "ja",
    };
    const global: MirConfig = { registries: [] };
    expect(mergeConfigs(local, global)).toMatchSnapshot();
  });

  it("グローバルのみ", () => {
    const local: MirConfig = { registries: [] };
    const global: MirConfig = {
      registries: [{ name: "global-reg", path: "~/.mir/registry" }],
      defaults: { author: "bob" },
      locale: "en",
    };
    expect(mergeConfigs(local, global)).toMatchSnapshot();
  });

  it("両方ありのマージ", () => {
    const local: MirConfig = {
      registries: [
        { name: "shared", path: "~/local-shared" },
        { name: "local-only", path: "~/local-only" },
      ],
      defaults: { author: "alice" },
      locale: "ja",
    };
    const global: MirConfig = {
      registries: [
        { name: "shared", path: "~/global-shared" },
        { name: "global-only", path: "~/global-only" },
      ],
      defaults: { author: "bob" },
      locale: "en",
    };
    expect(mergeConfigs(local, global)).toMatchSnapshot();
  });

  it("defaults マージ (ローカル author のみ)", () => {
    const local: MirConfig = {
      registries: [],
      defaults: { author: "alice" },
    };
    const global: MirConfig = {
      registries: [],
      defaults: { author: "bob" },
    };
    expect(mergeConfigs(local, global)).toMatchSnapshot();
  });

  it("locale は local ?? global", () => {
    const local: MirConfig = { registries: [] };
    const global: MirConfig = { registries: [], locale: "en" };
    expect(mergeConfigs(local, global)).toMatchSnapshot();
  });
});
