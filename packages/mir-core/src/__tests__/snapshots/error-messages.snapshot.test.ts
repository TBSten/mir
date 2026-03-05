/**
 * mir-core: エラーメッセージの snapshot テスト (日英)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  RegistryNotFoundError,
  RegistryRemoteError,
  PathTraversalError,
  FileConflictError,
  ValidationError,
  setLocale,
} from "../../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe("エラーメッセージ snapshot (日本語)", () => {
  beforeEach(() => setLocale("ja"));

  it("SnippetNotFoundError", () => {
    expect(new SnippetNotFoundError("react-hook").message).toMatchSnapshot();
  });

  it("SnippetAlreadyExistsError", () => {
    expect(new SnippetAlreadyExistsError("react-hook").message).toMatchSnapshot();
  });

  it("RegistryNotFoundError", () => {
    expect(new RegistryNotFoundError("official").message).toMatchSnapshot();
  });

  it("RegistryRemoteError (名前あり)", () => {
    expect(new RegistryRemoteError("official").message).toMatchSnapshot();
  });

  it("RegistryRemoteError (名前なし)", () => {
    expect(new RegistryRemoteError().message).toMatchSnapshot();
  });

  it("PathTraversalError", () => {
    expect(new PathTraversalError("../etc/passwd").message).toMatchSnapshot();
  });

  it("FileConflictError", () => {
    expect(new FileConflictError("index.ts").message).toMatchSnapshot();
  });
});

describe("エラーメッセージ snapshot (英語)", () => {
  beforeEach(() => setLocale("en"));

  it("SnippetNotFoundError", () => {
    expect(new SnippetNotFoundError("react-hook").message).toMatchSnapshot();
  });

  it("SnippetAlreadyExistsError", () => {
    expect(new SnippetAlreadyExistsError("react-hook").message).toMatchSnapshot();
  });

  it("RegistryNotFoundError", () => {
    expect(new RegistryNotFoundError("official").message).toMatchSnapshot();
  });

  it("RegistryRemoteError (名前あり)", () => {
    expect(new RegistryRemoteError("official").message).toMatchSnapshot();
  });

  it("PathTraversalError", () => {
    expect(new PathTraversalError("../etc/passwd").message).toMatchSnapshot();
  });

  it("FileConflictError", () => {
    expect(new FileConflictError("index.ts").message).toMatchSnapshot();
  });
});
