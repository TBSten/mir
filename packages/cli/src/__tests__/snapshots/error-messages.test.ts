import { describe, it, expect, afterEach } from "vitest";
import { setLocale } from "../../lib/i18n/index.js";
import {
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  RegistryNotFoundError,
  RegistryRemoteError,
  PathTraversalError,
  FileConflictError,
} from "../../lib/errors.js";

afterEach(() => {
  setLocale("ja");
});

describe("エラーメッセージ snapshot (日本語)", () => {
  it("SnippetNotFoundError", () => {
    expect(new SnippetNotFoundError("my-comp").message).toMatchSnapshot();
  });

  it("SnippetAlreadyExistsError", () => {
    expect(new SnippetAlreadyExistsError("my-comp").message).toMatchSnapshot();
  });

  it("RegistryNotFoundError", () => {
    expect(new RegistryNotFoundError("team").message).toMatchSnapshot();
  });

  it("RegistryRemoteError (named)", () => {
    expect(new RegistryRemoteError("community").message).toMatchSnapshot();
  });

  it("RegistryRemoteError (unnamed)", () => {
    expect(new RegistryRemoteError().message).toMatchSnapshot();
  });

  it("PathTraversalError", () => {
    expect(new PathTraversalError("../secret.txt").message).toMatchSnapshot();
  });

  it("FileConflictError", () => {
    expect(new FileConflictError("index.ts").message).toMatchSnapshot();
  });
});

describe("エラーメッセージ snapshot (英語)", () => {
  it("SnippetNotFoundError", () => {
    setLocale("en");
    expect(new SnippetNotFoundError("my-comp").message).toMatchSnapshot();
  });

  it("SnippetAlreadyExistsError", () => {
    setLocale("en");
    expect(new SnippetAlreadyExistsError("my-comp").message).toMatchSnapshot();
  });

  it("RegistryNotFoundError", () => {
    setLocale("en");
    expect(new RegistryNotFoundError("team").message).toMatchSnapshot();
  });

  it("RegistryRemoteError (named)", () => {
    setLocale("en");
    expect(new RegistryRemoteError("community").message).toMatchSnapshot();
  });

  it("PathTraversalError", () => {
    setLocale("en");
    expect(new PathTraversalError("../secret.txt").message).toMatchSnapshot();
  });

  it("FileConflictError", () => {
    setLocale("en");
    expect(new FileConflictError("index.ts").message).toMatchSnapshot();
  });
});
