import { describe, it, expect, vi, beforeEach } from "vitest";

// 応答キュー
let answerQueue: string[] = [];
const mockClose = vi.fn();

vi.mock("node:readline", () => ({
  default: {
    createInterface: vi.fn(() => ({
      question: vi.fn((_query: string, cb: (answer: string) => void) => {
        const answer = answerQueue.shift();
        if (answer !== undefined) {
          // 非同期にコールバックを呼ぶ
          setImmediate(() => cb(answer));
        }
      }),
      close: mockClose,
    })),
  },
}));

import { selectWithSuggests } from "../../lib/prompt.js";

beforeEach(() => {
  answerQueue = [];
  mockClose.mockClear();
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

describe("selectWithSuggests", () => {
  it("番号入力で対応する値を返す", async () => {
    answerQueue = ["1"];
    const result = await selectWithSuggests({
      question: "フレームワーク (framework)",
      suggests: ["react", "vue", "svelte"],
      allowManualInput: true,
    });
    expect(result).toBe("react");
  });

  it("最後の番号を選択できる", async () => {
    answerQueue = ["3"];
    const result = await selectWithSuggests({
      question: "テスト",
      suggests: ["a", "b", "c"],
      allowManualInput: false,
    });
    expect(result).toBe("c");
  });

  it("0 入力で手動入力フローに入る", async () => {
    answerQueue = ["0", "angular"];
    const result = await selectWithSuggests({
      question: "フレームワーク (framework)",
      suggests: ["react", "vue"],
      allowManualInput: true,
    });
    expect(result).toBe("angular");
  });

  it("allowManualInput=false のとき 0 入力は無効", async () => {
    answerQueue = ["0", "1"];
    const result = await selectWithSuggests({
      question: "型 (type)",
      suggests: ["true", "false"],
      allowManualInput: false,
    });
    expect(result).toBe("true");
  });

  it("範囲外の番号は再入力を促す", async () => {
    answerQueue = ["5", "2"];
    const result = await selectWithSuggests({
      question: "テスト",
      suggests: ["a", "b"],
      allowManualInput: false,
    });
    expect(result).toBe("b");
  });

  it("defaultValue がある場合 Enter のみで default を返す", async () => {
    answerQueue = [""];
    const result = await selectWithSuggests({
      question: "フレームワーク (framework)",
      suggests: ["react", "vue"],
      allowManualInput: true,
      defaultValue: "react",
    });
    expect(result).toBe("react");
  });

  it("defaultValue が suggests にない場合でも Enter で default を返す", async () => {
    answerQueue = [""];
    const result = await selectWithSuggests({
      question: "テスト",
      suggests: ["a", "b"],
      allowManualInput: true,
      defaultValue: "c",
    });
    expect(result).toBe("c");
  });
});
