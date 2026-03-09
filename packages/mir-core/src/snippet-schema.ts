import yaml from "js-yaml";
import { ValidationError } from "./errors.js";
import { safeParseYaml } from "./safe-yaml-parser.js";
import { validateSnippetBySchema } from "./schema-validator.js";

export interface VariableSchema {
  type?: "string" | "number" | "boolean";
  default?: unknown;
  enum?: unknown[];
}

export interface VariableDefinition {
  name?: string;
  description?: string;
  suggests?: string[];
  schema?: VariableSchema;
}

export interface Action {
  echo?: string;
  exit?: boolean;
  if?: string;
  input?: Record<
    string,
    {
      name?: string;
      description?: string;
      schema?: VariableSchema;
      "answer-to"?: string;
    }
  >;
}

export interface SnippetDefinition {
  name: string;
  /** semver 形式のバージョン文字列 (例: "1.0.0")。省略時は未バージョン管理扱い */
  version?: string;
  description?: string;
  tags?: string[];
  dependencies?: string[];
  variables?: Record<string, VariableDefinition>;
  hooks?: {
    "before-install"?: Action[];
    "after-install"?: Action[];
  };
}

export function parseSnippetYaml(content: string): SnippetDefinition {
  // 安全なパーサー使用（サイズ制限・カスタムタグ禁止）
  const parsed = safeParseYaml(content);
  if (typeof parsed !== "object" || parsed === null) {
    throw new ValidationError("snippet YAML のパースに失敗しました");
  }
  validateSnippetDefinition(parsed as SnippetDefinition);
  return parsed as SnippetDefinition;
}

export const SNIPPET_SCHEMA_URL =
  "https://raw.githubusercontent.com/TBSten/mir/refs/heads/main/schema/v1/snippet.schema.json";

export function serializeSnippetYaml(def: SnippetDefinition): string {
  const header = `# yaml-language-server: $schema=${SNIPPET_SCHEMA_URL}\n`;
  return header + yaml.dump(def, { noRefs: true, lineWidth: -1 });
}

/**
 * JSON Schema ベースでバリデーションする。
 * schema/v1/snippet.schema.json が single source of truth。
 */
export function validateSnippetDefinition(def: SnippetDefinition): void {
  validateSnippetBySchema(def);
}
