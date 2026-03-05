/**
 * mir-core: hooks エンジンの unit テスト
 */
import { describe, it, expect, vi } from "vitest";
import { executeHooks, ExitHookError, MirError } from "../index.js";
import type { Action } from "../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe.skip("executeHooks", () => {
  describe("echo アクション", () => {
    it("onEcho コールバックが呼ばれる", () => {
      const onEcho = vi.fn();
      const actions: Action[] = [{ echo: "hello" }];
      executeHooks(actions, {}, { onEcho });
      expect(onEcho).toHaveBeenCalledWith("hello");
    });

    it("echo メッセージ内の変数が展開される", () => {
      const onEcho = vi.fn();
      const actions: Action[] = [{ echo: "Hello, {{ name }}!" }];
      executeHooks(actions, { name: "World" }, { onEcho });
      expect(onEcho).toHaveBeenCalledWith("Hello, World!");
    });

    it("onEcho が未設定でもエラーにならない", () => {
      const actions: Action[] = [{ echo: "hello" }];
      expect(() => executeHooks(actions, {})).not.toThrow();
    });
  });

  describe("exit アクション", () => {
    it("exit: true で ExitHookError を throw", () => {
      const actions: Action[] = [{ exit: true }];
      expect(() => executeHooks(actions, {})).toThrow(ExitHookError);
    });

    it("exit: false では throw しない", () => {
      const actions: Action[] = [{ exit: false }];
      expect(() => executeHooks(actions, {})).not.toThrow();
    });

    it("if 条件が truthy の場合に exit", () => {
      const actions: Action[] = [{ exit: true, if: "{{ flag }}" }];
      expect(() => executeHooks(actions, { flag: "yes" })).toThrow(
        ExitHookError,
      );
    });

    it("if 条件が falsy (空文字) の場合は exit しない", () => {
      const actions: Action[] = [{ exit: true, if: "{{ flag }}" }];
      expect(() => executeHooks(actions, { flag: "" })).not.toThrow();
    });

    it("if 条件が 'false' の場合は exit しない", () => {
      const actions: Action[] = [{ exit: true, if: "{{ flag }}" }];
      expect(() => executeHooks(actions, { flag: "false" })).not.toThrow();
    });

    it("if 条件が '0' の場合は exit しない", () => {
      const actions: Action[] = [{ exit: true, if: "{{ flag }}" }];
      expect(() => executeHooks(actions, { flag: "0" })).not.toThrow();
    });
  });

  describe("input アクション", () => {
    it("default 値がある場合は変数に設定される", () => {
      const actions: Action[] = [
        {
          input: {
            q: {
              "answer-to": "answer",
              schema: { default: "yes" },
            },
          },
        },
      ];
      const result = executeHooks(actions, {});
      expect(result.answer).toBe("yes");
    });

    it("default がなく answer-to がある場合はエラー", () => {
      const actions: Action[] = [
        {
          input: {
            q: { "answer-to": "answer" },
          },
        },
      ];
      expect(() => executeHooks(actions, {})).toThrow(MirError);
    });

    it("answer-to がない場合はスキップ", () => {
      const actions: Action[] = [
        {
          input: { q: { description: "test" } },
        },
      ];
      expect(() => executeHooks(actions, {})).not.toThrow();
    });
  });

  describe("複合アクション", () => {
    it("複数のアクションが順番に実行される", () => {
      const onEcho = vi.fn();
      const actions: Action[] = [
        { echo: "step1" },
        { echo: "step2" },
        { echo: "step3" },
      ];
      executeHooks(actions, {}, { onEcho });
      expect(onEcho).toHaveBeenCalledTimes(3);
      expect(onEcho.mock.calls[0][0]).toBe("step1");
      expect(onEcho.mock.calls[1][0]).toBe("step2");
      expect(onEcho.mock.calls[2][0]).toBe("step3");
    });

    it("exit が途中で発生すると後続アクションは実行されない", () => {
      const onEcho = vi.fn();
      const actions: Action[] = [
        { echo: "before" },
        { exit: true },
        { echo: "after" },
      ];
      expect(() => executeHooks(actions, {}, { onEcho })).toThrow(
        ExitHookError,
      );
      expect(onEcho).toHaveBeenCalledTimes(1);
      expect(onEcho).toHaveBeenCalledWith("before");
    });

    it("元の変数オブジェクトは変更されない (immutable)", () => {
      const original = { key: "original" };
      const actions: Action[] = [
        {
          input: {
            q: { "answer-to": "newKey", schema: { default: "value" } },
          },
        },
      ];
      executeHooks(actions, original);
      expect(original).not.toHaveProperty("newKey");
    });
  });
});
