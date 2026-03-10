import { MirError } from "./errors.js";
import { expandTemplate, expandDefaultValue } from "./template-engine.js";
import { t } from "./i18n/index.js";
import type { Action } from "./snippet-schema.js";

export class ExitHookError extends MirError {
  constructor() {
    super(t("error.exit-hook"));
    this.name = "ExitHookError";
  }
}

export interface HookExecutionOptions {
  onEcho?: (message: string) => void;
}

export function executeHooks(
  actions: Action[],
  variables: Record<string, unknown>,
  options?: HookExecutionOptions,
): Record<string, unknown> {
  const vars = { ...variables };

  for (const action of actions) {
    if (action.echo !== undefined) {
      const message = expandTemplate(action.echo, vars);
      options?.onEcho?.(message);
    }

    if (action.exit !== undefined) {
      if (action.if !== undefined) {
        const condition = expandTemplate(action.if, vars);
        if (isTruthy(condition)) {
          throw new ExitHookError();
        }
      } else if (action.exit) {
        throw new ExitHookError();
      }
    }

    if (action.input !== undefined) {
      for (const [, inputDef] of Object.entries(action.input)) {
        const answerTo = inputDef["answer-to"];
        if (!answerTo) continue;

        if (inputDef.schema?.default !== undefined) {
          vars[answerTo] = expandDefaultValue(inputDef.schema.default, vars);
        } else {
          throw new MirError(
            t("error.hook-input-required", { key: answerTo }),
          );
        }
      }
    }
  }

  return vars;
}

function isTruthy(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "false" && trimmed !== "0";
}
