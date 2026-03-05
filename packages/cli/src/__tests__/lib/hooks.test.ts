import { describe, it, expect, vi } from "vitest";
import { executeHooks, ExitHookError } from "../../lib/hooks.js";
import { MirError } from "../../lib/errors.js";

vi.mock("../../lib/logger.js", () => ({
  success: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  label: vi.fn(),
  fileItem: vi.fn(),
  dirItem: vi.fn(),
}));
import * as logger from "../../lib/logger.js";
const mockInfo = vi.mocked(logger.info);

describe("executeHooks", () => {
  it("echo アクションでメッセージを表示する", () => {
    executeHooks([{ echo: "Hello {{ name }}" }], { name: "World" });
    expect(mockInfo).toHaveBeenCalledWith("Hello World");
  });

  it("exit アクションで例外を投げる", () => {
    expect(() => executeHooks([{ exit: true }], {})).toThrow(ExitHookError);
  });

  it("exit + if 条件が truthy の場合に例外を投げる", () => {
    expect(() =>
      executeHooks([{ exit: true, if: "{{ agree }}" }], { agree: "yes" }),
    ).toThrow(ExitHookError);
  });

  it("exit + if 条件が falsy の場合は継続する", () => {
    expect(() =>
      executeHooks([{ exit: true, if: "{{ agree }}" }], { agree: "" }),
    ).not.toThrow();
  });

  it("exit + if の値が false 文字列の場合は継続する", () => {
    expect(() =>
      executeHooks([{ exit: true, if: "false" }], {}),
    ).not.toThrow();
  });

  it("input アクションで default 値を使用する", () => {
    const result = executeHooks(
      [
        {
          input: {
            q: {
              name: "質問",
              schema: { type: "boolean", default: true },
              "answer-to": "answer",
            },
          },
        },
      ],
      {},
    );
    expect(result.answer).toBe(true);
  });

  it("input アクションで default がない場合はエラー", () => {
    expect(() =>
      executeHooks(
        [
          {
            input: {
              q: {
                name: "質問",
                schema: { type: "string" },
                "answer-to": "answer",
              },
            },
          },
        ],
        {},
      ),
    ).toThrow(MirError);
  });
});
