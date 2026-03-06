/**
 * 安全な YAML パーサー
 *
 * チケット 008-yaml-injection の対策として以下を実装:
 * - 入力サイズ上限チェック（YAML Bomb / DoS 対策）
 * - CORE_SCHEMA 使用によりカスタムタグ攻撃（!!js/function 等）を防止
 * - JSON Schema の $ref 禁止チェック（外部リソース読み込み攻撃対策）
 */
import yaml from "js-yaml";
import { ValidationError } from "./errors.js";

/**
 * YAML ドキュメントの最大許容サイズ（バイト）。
 * 64 KB を上限とする。通常の snippet 定義には十分な値。
 */
export const YAML_MAX_SIZE_BYTES = 64 * 1024; // 64 KB

/**
 * 安全な設定で YAML をパースする。
 *
 * - 入力サイズが YAML_MAX_SIZE_BYTES を超える場合は ValidationError を投げる
 * - CORE_SCHEMA を使用し、JS 固有のカスタムタグ（!!js/function 等）を禁止する
 *
 * @param content パースする YAML 文字列
 * @returns パース結果
 * @throws ValidationError 入力サイズ超過、または無効な YAML の場合
 */
export function safeParseYaml(content: string): unknown {
  // 入力サイズチェック（YAML Bomb 対策）
  const sizeBytes = Buffer.byteLength(content, "utf-8");
  if (sizeBytes > YAML_MAX_SIZE_BYTES) {
    throw new ValidationError(
      `YAML ドキュメントのサイズが上限 (${YAML_MAX_SIZE_BYTES} バイト) を超えています: ${sizeBytes} バイト`,
    );
  }

  try {
    // CORE_SCHEMA: bool/int/float/null のみを認識し、JS 固有タグ（!!js/function 等）を拒否する
    return yaml.load(content, {
      schema: yaml.CORE_SCHEMA,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new ValidationError(`YAML パースエラー: ${message}`);
  }
}

/**
 * JSON Schema オブジェクト内に $ref キーが存在しないか検証する。
 *
 * $ref を使った外部スキーマ読み込み攻撃を防ぐため、
 * snippet.yaml 内の schema フィールドには $ref を禁止する。
 *
 * @param schema 検証対象の schema 値（any）
 * @throws ValidationError $ref が見つかった場合
 */
export function checkNoRefInSchema(schema: unknown): void {
  if (schema === null || schema === undefined) {
    return;
  }
  // JSON.stringify 経由で深いネストも含めて $ref キーを検出する
  const serialized = JSON.stringify(schema);
  if (serialized.includes('"$ref"')) {
    throw new ValidationError(
      'snippet の schema フィールドに "$ref" を使用することはセキュリティ上禁止されています',
    );
  }
}
