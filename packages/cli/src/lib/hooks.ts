import { MirError } from "./errors.js";
import { expandTemplate } from "./template-engine.js";
import { t } from "./i18n/index.js";
import * as logger from "./logger.js";
import type { Action } from "./snippet-schema.js";

export class ExitHookError extends MirError {
  constructor() {
    super(t("error.exit-hook"));
    this.name = "ExitHookError";
  }
}

export function executeHooks(
  actions: Action[],
  variables: Record<string, unknown>,
): Record<string, unknown> {
  const vars = { ...variables };

  for (const action of actions) {
    if (action.echo !== undefined) {
      const message = expandTemplate(action.echo, vars);
      logger.info(message);
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
          vars[answerTo] = inputDef.schema.default;
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
