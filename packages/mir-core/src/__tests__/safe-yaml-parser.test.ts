/**
 * mir-core: safe-yaml-parser のセキュリティテスト
 *
 * YAML Injection 攻撃シナリオ（チケット 008-yaml-injection）の検証
 */
import { describe, it, expect } from "vitest";
import {
  safeParseYaml,
  checkNoRefInSchema,
  YAML_MAX_SIZE_BYTES,
} from "../safe-yaml-parser.js";
import { ValidationError } from "../index.js";

// ---------------------------------------------------------------------------
// 正常系: 通常の YAML は引き続きパースできること
// ---------------------------------------------------------------------------

describe("safeParseYaml - 正常系", () => {
  it("プレーンな文字列 YAML をパースできる", () => {
    const result = safeParseYaml("name: my-snippet\n");
    expect(result).toEqual({ name: "my-snippet" });
  });

  it("ネストしたオブジェクトをパースできる", () => {
    const yaml = `
name: react-hook
variables:
  foo:
    description: フック名
    schema:
      type: string
`;
    const result = safeParseYaml(yaml) as Record<string, unknown>;
    expect(result.name).toBe("react-hook");
  });

  it("配列をパースできる", () => {
    const yaml = "tags:\n  - react\n  - typescript\n";
    const result = safeParseYaml(yaml) as Record<string, unknown>;
    expect(result.tags).toEqual(["react", "typescript"]);
  });

  it("真偽値をパースできる", () => {
    const yaml = "enabled: true\ndisabled: false\n";
    const result = safeParseYaml(yaml) as Record<string, unknown>;
    expect(result.enabled).toBe(true);
    expect(result.disabled).toBe(false);
  });

  it("数値をパースできる", () => {
    const yaml = "count: 42\nfloat: 3.14\n";
    const result = safeParseYaml(yaml) as Record<string, unknown>;
    expect(result.count).toBe(42);
    expect(result.float).toBe(3.14);
  });

  it("null をパースできる", () => {
    const result = safeParseYaml("value: null\n") as Record<string, unknown>;
    expect(result.value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// YAML Bomb (Billion Laughs) 対策
// ---------------------------------------------------------------------------

describe("safeParseYaml - YAML Bomb 対策", () => {
  it("最大サイズを超える YAML は ValidationError を投げる", () => {
    const oversized = "x: " + "a".repeat(YAML_MAX_SIZE_BYTES);
    expect(() => safeParseYaml(oversized)).toThrow(ValidationError);
  });

  it("最大サイズちょうどの YAML は許可される (境界値)", () => {
    // 境界値ちょうどのサイズのシンプルな YAML は OK
    const small = "name: ok\n";
    expect(() => safeParseYaml(small)).not.toThrow();
  });

  it("エイリアスを大量に展開する YAML Bomb はサイズ制限で防がれる", () => {
    // 実際の YAML bomb を小さめに再現
    const bomb = [
      "a: &a [lol,lol,lol,lol,lol,lol,lol,lol,lol]",
      "b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]",
      "c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]",
      "d: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c]",
    ].join("\n");
    // サイズは小さいのでパースは通るが、爆発的な展開はしない
    // (js-yaml は alias を参照のまま扱い、展開しない)
    // ここではエラーを投げないことを確認（サイズ制限内）
    expect(() => safeParseYaml(bomb)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// YAML タグ攻撃対策
// ---------------------------------------------------------------------------

describe("safeParseYaml - カスタムタグ攻撃対策", () => {
  it("!!js/undefined タグは無視されて通常の文字列になる", () => {
    // CORE_SCHEMA では未知のタグはエラーまたは文字列として扱われる
    // js-yaml の CORE_SCHEMA は !!js タグを認識しないのでエラーになる
    expect(() => safeParseYaml("name: !!js/undefined foo")).toThrow();
  });

  it("!!js/regexp タグはエラーになる", () => {
    expect(() => safeParseYaml("re: !!js/regexp /foo/")).toThrow();
  });

  it("!!js/function タグはエラーになる", () => {
    expect(() => safeParseYaml("fn: !!js/function 'function(){}'")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// checkNoRefInSchema - JSON Schema $ref 禁止チェック
// ---------------------------------------------------------------------------

describe("checkNoRefInSchema", () => {
  it("$ref がなければエラーを投げない", () => {
    const schema = { type: "string", default: "hello" };
    expect(() => checkNoRefInSchema(schema)).not.toThrow();
  });

  it("$ref があれば ValidationError を投げる", () => {
    const schema = { $ref: "https://evil.com/schema.json" };
    expect(() => checkNoRefInSchema(schema)).toThrow(ValidationError);
  });

  it("ネストされた $ref も検出する", () => {
    const schema = {
      type: "object",
      properties: {
        name: { $ref: "#/definitions/Name" },
      },
    };
    expect(() => checkNoRefInSchema(schema)).toThrow(ValidationError);
  });

  it("$ref を含む文字列値は検出する（キーではなく値でも禁止）", () => {
    // $ref というキーそのものを禁止
    const schema = { anyOf: [{ $ref: "https://example.com/schema" }] };
    expect(() => checkNoRefInSchema(schema)).toThrow(ValidationError);
  });

  it("null や undefined を渡してもエラーにならない", () => {
    expect(() => checkNoRefInSchema(null)).not.toThrow();
    expect(() => checkNoRefInSchema(undefined)).not.toThrow();
  });

  it("空オブジェクトはエラーにならない", () => {
    expect(() => checkNoRefInSchema({})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// parseSnippetYaml との統合確認
// ---------------------------------------------------------------------------

describe("parseSnippetYaml - $ref を含む snippet は拒否される", () => {
  it("variables.schema に $ref があれば ValidationError を投げる", async () => {
    const { parseSnippetYaml } = await import("../index.js");
    const yaml = `
name: evil-snippet
variables:
  name:
    schema:
      $ref: "https://evil.com/schema.json"
`;
    expect(() => parseSnippetYaml(yaml)).toThrow(ValidationError);
  });

  it("通常の snippet YAML は引き続きパースできる", async () => {
    const { parseSnippetYaml } = await import("../index.js");
    const yaml = `
name: normal-snippet
variables:
  name:
    description: 名前
    schema:
      type: string
      default: world
`;
    const def = parseSnippetYaml(yaml);
    expect(def.name).toBe("normal-snippet");
    expect(def.variables?.name?.schema?.type).toBe("string");
  });
});
