/**
 * JSON Schema から ajv standalone バリデーション関数を生成するスクリプト。
 *
 * schema/v1/*.schema.json を読み込み、
 * packages/mir-core/src/generated/ にバリデーション関数の ESM コードを出力する。
 */
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.resolve(__dirname, "../../../schema/v1");
const outDir = path.resolve(__dirname, "../src/generated");

const schemas = [
  {
    file: "snippet.schema.json",
    exportName: "validateSnippet",
    outFile: "validate-snippet.js",
  },
  {
    file: "mirconfig.schema.json",
    exportName: "validateMirconfig",
    outFile: "validate-mirconfig.js",
  },
];

fs.mkdirSync(outDir, { recursive: true });

for (const entry of schemas) {
  const schemaPath = path.join(schemaDir, entry.file);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

  // $schema はメタスキーマ参照なのでバリデーション時には不要
  delete schema.$schema;

  const ajv = new Ajv({
    code: { source: true, esm: true },
    allErrors: true,
    strict: false,
  });

  const validate = ajv.compile(schema);
  const code = standaloneCode(ajv, validate);

  const outPath = path.join(outDir, entry.outFile);
  fs.writeFileSync(outPath, code, "utf-8");

  // TypeScript 用の型定義ファイルも生成
  const dtsContent = `import type { ValidateFunction } from "ajv";
declare const validate: ValidateFunction;
export default validate;
`;
  fs.writeFileSync(outPath.replace(/\.js$/, ".d.ts"), dtsContent, "utf-8");

  console.log(`Generated: ${outPath}`);
}

console.log("Done.");
