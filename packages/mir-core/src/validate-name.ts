import { ValidationError } from "./errors.js";
import { t } from "./i18n/index.js";

const SNIPPET_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

export function validateSnippetName(name: string): void {
  if (!SNIPPET_NAME_PATTERN.test(name)) {
    throw new ValidationError(
      t("error.invalid-snippet-name", { name }),
    );
  }
}
