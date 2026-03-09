/**
 * JSON Schema ベースのバリデーション。
 *
 * schema/v1/*.schema.json を single source of truth として、
 * ajv standalone で生成されたバリデーション関数を使用する。
 */
import { ValidationError } from "./errors.js";
import { checkNoRefInSchema } from "./safe-yaml-parser.js";

import validateSnippetGenerated from "./generated/validate-snippet.js";

import validateMirconfigGenerated from "./generated/validate-mirconfig.js";

interface AjvError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}

function formatAjvErrors(errors: AjvError[]): string {
  return errors
    .map((e) => {
      const path = e.instancePath || "(root)";
      return `${path}: ${e.message ?? e.keyword}`;
    })
    .join("\n");
}

/**
 * snippet 定義を JSON Schema でバリデーションする。
 * セキュリティ対策として variables 内の $ref チェックも行う。
 */
export function validateSnippetBySchema(data: unknown): void {
  // セキュリティ: ユーザー提供の schema フィールド内の $ref を禁止
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.variables && typeof obj.variables === "object") {
      for (const varDef of Object.values(
        obj.variables as Record<string, Record<string, unknown>>,
      )) {
        if (varDef && typeof varDef === "object") {
          checkNoRefInSchema(varDef.schema);
        }
      }
    }
  }

  const valid = validateSnippetGenerated(data);
  if (!valid) {
    const errors = validateSnippetGenerated.errors as AjvError[];
    throw new ValidationError(formatAjvErrors(errors));
  }
}

/**
 * mirconfig を JSON Schema でバリデーションする。
 */
export function validateMirconfigBySchema(data: unknown): void {
  const valid = validateMirconfigGenerated(data);
  if (!valid) {
    const errors = validateMirconfigGenerated.errors as AjvError[];
    throw new ValidationError(formatAjvErrors(errors));
  }
}
