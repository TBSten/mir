import { describe, it, expect } from "vitest";
import { validateSnippetName } from "../../lib/validate-name.js";
import { ValidationError } from "../../lib/errors.js";

describe("validateSnippetName", () => {
  it("有効な名前を受け入れる", () => {
    expect(() => validateSnippetName("my-component")).not.toThrow();
    expect(() => validateSnippetName("react-hook")).not.toThrow();
    expect(() => validateSnippetName("a")).not.toThrow();
    expect(() => validateSnippetName("test123")).not.toThrow();
    expect(() => validateSnippetName("A1-b2")).not.toThrow();
  });

  it("ハイフンで始まる名前を拒否する", () => {
    expect(() => validateSnippetName("-invalid")).toThrow(ValidationError);
  });

  it("空文字を拒否する", () => {
    expect(() => validateSnippetName("")).toThrow(ValidationError);
  });

  it("特殊文字を含む名前を拒否する", () => {
    expect(() => validateSnippetName("my_component")).toThrow(ValidationError);
    expect(() => validateSnippetName("my.component")).toThrow(ValidationError);
    expect(() => validateSnippetName("my component")).toThrow(ValidationError);
    expect(() => validateSnippetName("my/component")).toThrow(ValidationError);
  });
});
