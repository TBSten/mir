import { describe, it, expect } from "vitest";
import {
  lowercase,
  uppercase,
  capitalize,
  uncapitalize,
  replace,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  trim,
} from "../../helpers/string-helpers.js";

describe("lowercase", () => {
  it("大文字を小文字に変換", () => expect(lowercase("HELLO")).toBe("hello"));
  it("空文字", () => expect(lowercase("")).toBe(""));
  it("undefined は 'undefined' に変換", () =>
    expect(lowercase(undefined)).toBe("undefined"));
  it("数値は文字列化", () => expect(lowercase(123)).toBe("123"));
});

describe("uppercase", () => {
  it("小文字を大文字に変換", () => expect(uppercase("hello")).toBe("HELLO"));
  it("空文字", () => expect(uppercase("")).toBe(""));
});

describe("capitalize", () => {
  it("先頭を大文字に", () => expect(capitalize("hello")).toBe("Hello"));
  it("空文字", () => expect(capitalize("")).toBe(""));
  it("1文字", () => expect(capitalize("a")).toBe("A"));
});

describe("uncapitalize", () => {
  it("先頭を小文字に", () => expect(uncapitalize("Hello")).toBe("hello"));
  it("空文字", () => expect(uncapitalize("")).toBe(""));
  it("1文字", () => expect(uncapitalize("A")).toBe("a"));
});

describe("replace", () => {
  it("リテラル文字列を置換", () =>
    expect(replace("com/example/app", "/", ".")).toBe("com.example.app"));
  it("マッチしない場合はそのまま", () =>
    expect(replace("hello", "x", "y")).toBe("hello"));
  it("空の search は何もしない", () =>
    expect(replace("hello", "", "x")).toBe("hello"));
  it("正規表現メタ文字がリテラルとして扱われる", () =>
    expect(replace("a.b.c", ".", "-")).toBe("a-b-c"));
  it("$記号を含む replacement が安全に処理される", () =>
    expect(replace("hello", "l", "$1")).toBe("he$1$1o"));
});

describe("camelCase", () => {
  it("kebab-case → camelCase", () =>
    expect(camelCase("my-component")).toBe("myComponent"));
  it("snake_case → camelCase", () =>
    expect(camelCase("my_component")).toBe("myComponent"));
  it("PascalCase → camelCase", () =>
    expect(camelCase("MyComponent")).toBe("myComponent"));
  it("スペース区切り", () =>
    expect(camelCase("hello world")).toBe("helloWorld"));
  it("ドット区切り", () =>
    expect(camelCase("com.example.app")).toBe("comExampleApp"));
  it("空文字", () => expect(camelCase("")).toBe(""));
  it("単一単語", () => expect(camelCase("hello")).toBe("hello"));
});

describe("pascalCase", () => {
  it("kebab-case → PascalCase", () =>
    expect(pascalCase("my-component")).toBe("MyComponent"));
  it("camelCase → PascalCase", () =>
    expect(pascalCase("myComponent")).toBe("MyComponent"));
  it("空文字", () => expect(pascalCase("")).toBe(""));
});

describe("snakeCase", () => {
  it("camelCase → snake_case", () =>
    expect(snakeCase("myComponent")).toBe("my_component"));
  it("kebab-case → snake_case", () =>
    expect(snakeCase("my-component")).toBe("my_component"));
  it("PascalCase → snake_case", () =>
    expect(snakeCase("MyComponent")).toBe("my_component"));
  it("空文字", () => expect(snakeCase("")).toBe(""));
});

describe("kebabCase", () => {
  it("camelCase → kebab-case", () =>
    expect(kebabCase("myComponent")).toBe("my-component"));
  it("PascalCase → kebab-case", () =>
    expect(kebabCase("MyComponent")).toBe("my-component"));
  it("snake_case → kebab-case", () =>
    expect(kebabCase("my_component")).toBe("my-component"));
  it("空文字", () => expect(kebabCase("")).toBe(""));
});

describe("trim", () => {
  it("前後空白を除去", () => expect(trim("  hello  ")).toBe("hello"));
  it("空文字", () => expect(trim("")).toBe(""));
  it("改行を除去", () => expect(trim("\nhello\n")).toBe("hello"));
});
