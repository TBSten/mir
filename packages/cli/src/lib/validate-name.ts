import { ValidationError } from "./errors.js";

const SNIPPET_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

export function validateSnippetName(name: string): void {
  if (!SNIPPET_NAME_PATTERN.test(name)) {
    throw new ValidationError(
      `不正な snippet 名 "${name}" です。英数字とハイフンのみ使用可能で、先頭は英数字にしてください`,
    );
  }
}
