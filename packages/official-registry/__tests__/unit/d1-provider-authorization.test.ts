import { describe, it, expect, vi } from "vitest";
import { createD1Provider } from "../../app/lib/d1-provider.js";

/**
 * D1Database のモック。
 * prepare().bind().first() / prepare().bind().all() / prepare().all() をシミュレート。
 */
function createMockDb(options: {
  allResults?: any[];
  allSuccess?: boolean;
  firstResult?: any;
  filesResults?: any[];
  filesSuccess?: boolean;
}) {
  const {
    allResults = [],
    allSuccess = true,
    firstResult = null,
    filesResults = [],
    filesSuccess = true,
  } = options;

  let callCount = 0;

  return {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(firstResult),
        all: vi.fn().mockImplementation(async () => {
          callCount++;
          // 最初の all() はスニペット情報、2番目はファイル情報
          if (callCount <= 1) {
            return { success: allSuccess, results: allResults };
          }
          return { success: filesSuccess, results: filesResults };
        }),
      }),
      all: vi.fn().mockResolvedValue({
        success: allSuccess,
        results: allResults,
      }),
    }),
  } as unknown as D1Database;
}

describe("D1 Provider: list() の authorization_status", () => {
  it("各ステータスが正しくマッピングされる", async () => {
    const db = createMockDb({
      allResults: [
        { name: "s1", authorization_status: "approved" },
        { name: "s2", authorization_status: "examination" },
        { name: "s3", authorization_status: "rejected" },
      ],
    });
    const provider = createD1Provider(db);
    const list = await provider.list();

    expect(list).toHaveLength(3);
    expect(list[0].authorizationStatus).toBe("approved");
    expect(list[1].authorizationStatus).toBe("examination");
    expect(list[2].authorizationStatus).toBe("rejected");
  });

  it("authorization_status が null/空 → examination にフォールバック", async () => {
    const db = createMockDb({
      allResults: [
        { name: "s1", authorization_status: null },
        { name: "s2", authorization_status: "" },
        { name: "s3", authorization_status: undefined },
      ],
    });
    const provider = createD1Provider(db);
    const list = await provider.list();

    for (const item of list) {
      expect(item.authorizationStatus).toBe("examination");
    }
  });

  it("クエリ失敗時は空配列", async () => {
    const db = createMockDb({ allSuccess: false });
    const provider = createD1Provider(db);
    const list = await provider.list();
    expect(list).toEqual([]);
  });

  it("例外発生時は空配列", async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    } as unknown as D1Database;
    const provider = createD1Provider(db);
    const list = await provider.list();
    expect(list).toEqual([]);
  });
});

describe("D1 Provider: get() の authorization_status", () => {
  it("approved ステータスが返る", async () => {
    const db = createMockDb({
      firstResult: {
        id: 1,
        name: "test",
        authorization_status: "approved",
      },
      filesResults: [
        { file_path: "index.ts", content: "// test" },
      ],
      filesSuccess: true,
    });
    // get は first() → all() の順で呼ぶため、特殊なモックが必要
    const mockFirst = vi.fn().mockResolvedValue({
      id: 1,
      name: "test",
      authorization_status: "approved",
    });
    const mockFilesAll = vi.fn().mockResolvedValue({
      success: true,
      results: [{ file_path: "index.ts", content: "// test" }],
    });
    const mockBind = vi.fn()
      .mockReturnValueOnce({ first: mockFirst })
      .mockReturnValueOnce({ all: mockFilesAll });
    (db as any).prepare = vi.fn().mockReturnValue({ bind: mockBind });

    const provider = createD1Provider(db);
    const detail = await provider.get("test");

    expect(detail).not.toBeNull();
    expect(detail!.authorizationStatus).toBe("approved");
  });

  it("examination ステータスが返る (デフォルト)", async () => {
    const mockFirst = vi.fn().mockResolvedValue({
      id: 2,
      name: "new-snippet",
      authorization_status: "examination",
    });
    const mockFilesAll = vi.fn().mockResolvedValue({
      success: true,
      results: [],
    });
    const mockBind = vi.fn()
      .mockReturnValueOnce({ first: mockFirst })
      .mockReturnValueOnce({ all: mockFilesAll });
    const db = {
      prepare: vi.fn().mockReturnValue({ bind: mockBind }),
    } as unknown as D1Database;

    const provider = createD1Provider(db);
    const detail = await provider.get("new-snippet");

    expect(detail).not.toBeNull();
    expect(detail!.authorizationStatus).toBe("examination");
  });

  it("authorization_status が null → examination にフォールバック", async () => {
    const mockFirst = vi.fn().mockResolvedValue({
      id: 3,
      name: "no-status",
      authorization_status: null,
    });
    const mockFilesAll = vi.fn().mockResolvedValue({
      success: true,
      results: [],
    });
    const mockBind = vi.fn()
      .mockReturnValueOnce({ first: mockFirst })
      .mockReturnValueOnce({ all: mockFilesAll });
    const db = {
      prepare: vi.fn().mockReturnValue({ bind: mockBind }),
    } as unknown as D1Database;

    const provider = createD1Provider(db);
    const detail = await provider.get("no-status");

    expect(detail).not.toBeNull();
    expect(detail!.authorizationStatus).toBe("examination");
  });

  it("存在しない snippet → null", async () => {
    const mockFirst = vi.fn().mockResolvedValue(null);
    const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
    const db = {
      prepare: vi.fn().mockReturnValue({ bind: mockBind }),
    } as unknown as D1Database;

    const provider = createD1Provider(db);
    const detail = await provider.get("nonexistent");

    expect(detail).toBeNull();
  });

  it("例外発生時は null", async () => {
    const mockBind = vi.fn().mockReturnValue({
      first: vi.fn().mockRejectedValue(new Error("DB error")),
    });
    const db = {
      prepare: vi.fn().mockReturnValue({ bind: mockBind }),
    } as unknown as D1Database;

    const provider = createD1Provider(db);
    const detail = await provider.get("error-snippet");

    expect(detail).toBeNull();
  });
});

describe("D1 Provider: list() レスポンス構造スナップショット", () => {
  it("全ステータスを含むリスト", async () => {
    const db = createMockDb({
      allResults: [
        { name: "approved-snippet", version: "1.0.0", description: "An approved snippet", authorization_status: "approved" },
        { name: "exam-snippet", version: null, description: "Under review", authorization_status: "examination" },
        { name: "rejected-snippet", version: "0.1.0", description: null, authorization_status: "rejected" },
      ],
    });
    const provider = createD1Provider(db);
    const list = await provider.list();
    expect(list).toMatchSnapshot();
  });
});
