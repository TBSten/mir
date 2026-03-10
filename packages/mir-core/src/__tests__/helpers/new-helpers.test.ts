import { describe, it, expect } from "vitest";
import {
  contains,
  startsWith,
  endsWith,
  dotCase,
  pathCase,
  concat,
  slice,
  length,
} from "../../helpers/string-helpers.js";

describe("contains", () => {
  it("部分文字列が含まれる場合 true", () =>
    expect(contains("hello world", "world")).toBe(true));
  it("含まれない場合 false", () =>
    expect(contains("hello", "world")).toBe(false));
  it("空文字列は常に含まれる", () =>
    expect(contains("hello", "")).toBe(true));
  it("大文字小文字を区別する", () =>
    expect(contains("Hello", "hello")).toBe(false));
});

describe("startsWith", () => {
  it("先頭一致で true", () =>
    expect(startsWith("hello world", "hello")).toBe(true));
  it("先頭一致しない場合 false", () =>
    expect(startsWith("hello", "world")).toBe(false));
  it("空文字列は常に true", () =>
    expect(startsWith("hello", "")).toBe(true));
});

describe("endsWith", () => {
  it("末尾一致で true", () =>
    expect(endsWith("hello world", "world")).toBe(true));
  it("末尾一致しない場合 false", () =>
    expect(endsWith("hello", "world")).toBe(false));
  it("空文字列は常に true", () =>
    expect(endsWith("hello", "")).toBe(true));
});

describe("dotCase", () => {
  it("kebab-case → dot.case", () =>
    expect(dotCase("my-component")).toBe("my.component"));
  it("camelCase → dot.case", () =>
    expect(dotCase("myComponent")).toBe("my.component"));
  it("PascalCase → dot.case", () =>
    expect(dotCase("MyComponent")).toBe("my.component"));
  it("snake_case → dot.case", () =>
    expect(dotCase("my_component")).toBe("my.component"));
  it("スラッシュ区切り → dot.case", () =>
    expect(dotCase("com/example/app")).toBe("com.example.app"));
  it("空文字", () => expect(dotCase("")).toBe(""));
});

describe("pathCase", () => {
  it("kebab-case → path/case", () =>
    expect(pathCase("my-component")).toBe("my/component"));
  it("camelCase → path/case", () =>
    expect(pathCase("myComponent")).toBe("my/component"));
  it("ドット区切り → path/case", () =>
    expect(pathCase("com.example.app")).toBe("com/example/app"));
  it("空文字", () => expect(pathCase("")).toBe(""));
});

describe("concat", () => {
  it("2つの文字列を結合", () =>
    expect(concat("hello", " world")).toBe("hello world"));
  it("3つの文字列を結合", () =>
    expect(concat("a", "b", "c")).toBe("abc"));
  it("数値も文字列化して結合", () =>
    expect(concat("v", 1)).toBe("v1"));
});

describe("slice", () => {
  it("開始位置のみ指定", () =>
    expect(slice("hello", 2)).toBe("llo"));
  it("開始と終了位置を指定", () =>
    expect(slice("hello", 1, 4)).toBe("ell"));
  it("負のインデックス", () =>
    expect(slice("hello", -3)).toBe("llo"));
});

describe("length", () => {
  it("文字列の長さを返す", () =>
    expect(length("hello")).toBe(5));
  it("空文字列は 0", () =>
    expect(length("")).toBe(0));
  it("数値は文字列化して長さを返す", () =>
    expect(length(123)).toBe(3));
});
