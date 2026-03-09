import { describe, it, expect } from "vitest";

/**
 * AuthorizationBadge コンポーネントのロジックテスト。
 * JSX レンダリングは HonoX に依存するため、ロジック部分のみテストする。
 */

type BadgeResult = {
  type: "none" | "approved" | "examination" | "rejected";
  label?: string;
  color?: string;
};

/**
 * AuthorizationBadge のロジックを再現。
 * 実装: packages/official-registry/app/routes/snippets/[name].tsx L217-240
 */
function resolveBadge(status?: string): BadgeResult {
  if (!status || status === "approved") {
    if (status === "approved") {
      return { type: "approved", label: "approved", color: "green" };
    }
    return { type: "none" };
  }
  if (status === "rejected") {
    return { type: "rejected", label: "rejected", color: "red" };
  }
  return { type: "examination", label: "examination", color: "yellow" };
}

/**
 * 警告メッセージのロジックを再現。
 * 実装: packages/official-registry/app/routes/snippets/[name].tsx L66-78
 */
function resolveWarning(status?: string): string | null {
  if (!status || status === "approved") return null;
  if (status === "rejected") {
    return "このスニペットは審査により却下されました。利用にはご注意ください。";
  }
  return "このスニペットはまだ審査中です。公式に承認されていません。";
}

describe("AuthorizationBadge ロジック", () => {
  describe("ステータスごとの表示", () => {
    it("approved → 緑バッジ", () => {
      const badge = resolveBadge("approved");
      expect(badge.type).toBe("approved");
      expect(badge.color).toBe("green");
      expect(badge.label).toBe("approved");
    });

    it("examination → 黄色バッジ", () => {
      const badge = resolveBadge("examination");
      expect(badge.type).toBe("examination");
      expect(badge.color).toBe("yellow");
      expect(badge.label).toBe("examination");
    });

    it("rejected → 赤バッジ", () => {
      const badge = resolveBadge("rejected");
      expect(badge.type).toBe("rejected");
      expect(badge.color).toBe("red");
      expect(badge.label).toBe("rejected");
    });

    it("undefined → バッジなし", () => {
      const badge = resolveBadge(undefined);
      expect(badge.type).toBe("none");
      expect(badge.label).toBeUndefined();
    });

    it("空文字列 → バッジなし (falsy)", () => {
      const badge = resolveBadge("");
      expect(badge.type).toBe("none");
    });
  });

  describe("スナップショット", () => {
    const cases = [
      undefined,
      "approved",
      "examination",
      "rejected",
    ];

    for (const status of cases) {
      it(`resolveBadge("${status}") のスナップショット`, () => {
        expect(resolveBadge(status)).toMatchSnapshot();
      });
    }
  });
});

describe("警告メッセージロジック", () => {
  it("approved → 警告なし", () => {
    expect(resolveWarning("approved")).toBeNull();
  });

  it("undefined → 警告なし", () => {
    expect(resolveWarning(undefined)).toBeNull();
  });

  it("examination → 審査中メッセージ", () => {
    const msg = resolveWarning("examination");
    expect(msg).toContain("審査中");
    expect(msg).toContain("承認されていません");
  });

  it("rejected → 却下メッセージ", () => {
    const msg = resolveWarning("rejected");
    expect(msg).toContain("却下");
    expect(msg).toContain("ご注意");
  });

  describe("スナップショット", () => {
    const cases = [undefined, "approved", "examination", "rejected"];

    for (const status of cases) {
      it(`resolveWarning("${status}") のスナップショット`, () => {
        expect(resolveWarning(status)).toMatchSnapshot();
      });
    }
  });
});

describe("バッジとメッセージの一貫性", () => {
  it("バッジ表示なし ↔ 警告なし の一貫性", () => {
    // approved と undefined はバッジなし or 緑バッジで、警告なし
    expect(resolveBadge(undefined).type).toBe("none");
    expect(resolveWarning(undefined)).toBeNull();

    expect(resolveBadge("approved").type).toBe("approved");
    expect(resolveWarning("approved")).toBeNull();
  });

  it("examination: バッジあり + 警告あり", () => {
    expect(resolveBadge("examination").type).toBe("examination");
    expect(resolveWarning("examination")).not.toBeNull();
  });

  it("rejected: バッジあり + 警告あり", () => {
    expect(resolveBadge("rejected").type).toBe("rejected");
    expect(resolveWarning("rejected")).not.toBeNull();
  });
});
