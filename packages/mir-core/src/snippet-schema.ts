import yaml from "js-yaml";
import { ValidationError } from "./errors.js";
import { validateSnippetName } from "./validate-name.js";

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
  description?: string;
  variables?: Record<string, VariableDefinition>;
  hooks?: {
    "before-install"?: Action[];
    "after-install"?: Action[];
  };
}

export function parseSnippetYaml(content: string): SnippetDefinition {
  const parsed = yaml.load(content);
  if (typeof parsed !== "object" || parsed === null) {
    throw new ValidationError("snippet YAML のパースに失敗しました");
  }
  const def = parsed as SnippetDefinition;
  validateSnippetDefinition(def);
  return def;
}

export function serializeSnippetYaml(def: SnippetDefinition): string {
  return yaml.dump(def, { noRefs: true, lineWidth: -1 });
}

export function validateSnippetDefinition(def: SnippetDefinition): void {
  if (!def.name || typeof def.name !== "string") {
    throw new ValidationError("snippet 定義に name フィールドが必要です");
  }
  validateSnippetName(def.name);
  if (def.variables !== undefined) {
    if (typeof def.variables !== "object" || def.variables === null) {
      throw new ValidationError("variables はオブジェクトでなければなりません");
    }
    for (const [key, varDef] of Object.entries(def.variables)) {
      if (typeof varDef !== "object" || varDef === null) {
        throw new ValidationError(
          `変数 "${key}" の定義はオブジェクトでなければなりません`,
        );
      }
      if (varDef.suggests !== undefined) {
        if (!Array.isArray(varDef.suggests)) {
          throw new ValidationError(
            `変数 "${key}" の suggests は配列でなければなりません`,
          );
        }
        for (const item of varDef.suggests) {
          if (typeof item !== "string") {
            throw new ValidationError(
              `変数 "${key}" の suggests の各要素は文字列でなければなりません`,
            );
          }
        }
      }
      if (varDef.schema?.type !== undefined) {
        const validTypes = ["string", "number", "boolean"];
        if (!validTypes.includes(varDef.schema.type)) {
          throw new ValidationError(
            `変数 "${key}" の type "${varDef.schema.type}" は無効です。string, number, boolean のいずれかを指定してください`,
          );
        }
      }
    }
  }
}
