import { describe, it, expect } from "vitest";
import { executeHooks, type Action } from "@mir/core";

describe("executeHooks snapshot", () => {
  it("echo アクションの変数返却値", () => {
    const actions: Action[] = [
      { echo: "Hello {{ name }}!" },
    ];
    const vars = { name: "Alice", count: 3 };
    const result = executeHooks(actions, vars);
    expect(result).toMatchSnapshot();
  });

  it("input アクション (default あり) の変数返却値", () => {
    const actions: Action[] = [
      {
        input: {
          userName: {
            name: "userName",
            description: "ユーザー名",
            "answer-to": "userName",
            schema: { type: "string", default: "DefaultUser" },
          },
        },
      },
    ];
    const vars = { existing: "value" };
    const result = executeHooks(actions, vars);
    expect(result).toMatchSnapshot();
  });

  it("複数アクションの組み合わせ", () => {
    const actions: Action[] = [
      { echo: "Setting up..." },
      {
        input: {
          theme: {
            name: "theme",
            "answer-to": "theme",
            schema: { type: "string", default: "dark" },
          },
        },
      },
      { echo: "Theme set to {{ theme }}" },
    ];
    const vars = { name: "mir" };
    const result = executeHooks(actions, vars);
    expect(result).toMatchSnapshot();
  });

  it("exit: true, if: 'false' は throw しない", () => {
    const actions: Action[] = [
      { exit: true, if: "false" },
    ];
    const result = executeHooks(actions, { key: "val" });
    expect(result).toMatchSnapshot();
  });
});
