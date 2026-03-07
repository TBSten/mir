import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { executeHooks, ExitHookError, type Action } from "@tbsten/mir-core";

describe("executeHooks property-based", () => {
  it("echo アクションを渡しても変数は変更されない", () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]\w*$/.test(s)),
          fc.string({ maxLength: 30 }),
        ),
        fc.string({ maxLength: 50 }).filter((s) => !s.includes("{{") && !s.includes("}}")),
        (vars, message) => {
          const actions: Action[] = [{ echo: message }];
          const result = executeHooks(actions, vars);
          expect(result).toEqual(vars);
        },
      ),
    );
  });

  it("exit: true, if: 'false' → ExitHookError が発生しない", () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]\w*$/.test(s)),
          fc.string({ maxLength: 20 }),
        ),
        (vars) => {
          const actions: Action[] = [{ exit: true, if: "false" }];
          expect(() => executeHooks(actions, vars)).not.toThrow();
        },
      ),
    );
  });

  it("exit: true, if: 'true' → ExitHookError が発生する", () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]\w*$/.test(s)),
          fc.string({ maxLength: 20 }),
        ),
        (vars) => {
          const actions: Action[] = [{ exit: true, if: "true" }];
          expect(() => executeHooks(actions, vars)).toThrow(ExitHookError);
        },
      ),
    );
  });
});
