import { describe, it, expect, vi } from "vitest";
import { executeHooks, ExitHookError, MirError } from "@tbsten/mir-core";

describe("executeHooks", () => {
  it("echo アクションでメッセージを表示する", () => {
    const onEcho = vi.fn();
    executeHooks([{ echo: "Hello {{ name }}" }], { name: "World" }, { onEcho });
    expect(onEcho).toHaveBeenCalledWith("Hello World");
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
