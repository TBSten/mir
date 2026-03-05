/**
 * mir-core: エラークラスの unit テスト
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  MirError,
  ValidationError,
  SnippetNotFoundError,
  SnippetAlreadyExistsError,
  RegistryNotFoundError,
  RegistryRemoteError,
  PathTraversalError,
  FileConflictError,
  setLocale,
} from "../index.js";

// TODO: 現時点では理想の挙動をテストケースとして記述。後で有効化する。

describe.skip("エラークラス", () => {
  beforeEach(() => {
    setLocale("ja");
  });

  it("MirError は Error を継承", () => {
    const err = new MirError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("MirError");
  });

  it("ValidationError は MirError を継承", () => {
    const err = new ValidationError("test");
    expect(err).toBeInstanceOf(MirError);
    expect(err.name).toBe("ValidationError");
  });

  it("SnippetNotFoundError のメッセージに名前が含まれる", () => {
    const err = new SnippetNotFoundError("react-hook");
    expect(err.message).toContain("react-hook");
    expect(err.name).toBe("SnippetNotFoundError");
  });

  it("SnippetAlreadyExistsError のメッセージに名前が含まれる", () => {
    const err = new SnippetAlreadyExistsError("react-hook");
    expect(err.message).toContain("react-hook");
  });

  it("RegistryNotFoundError のメッセージに名前が含まれる", () => {
    const err = new RegistryNotFoundError("my-registry");
    expect(err.message).toContain("my-registry");
  });

  it("RegistryRemoteError (名前あり)", () => {
    const err = new RegistryRemoteError("remote-reg");
    expect(err.message).toContain("remote-reg");
  });

  it("RegistryRemoteError (名前なし)", () => {
    const err = new RegistryRemoteError();
    expect(err.message).not.toBe("");
  });

  it("PathTraversalError のメッセージにパスが含まれる", () => {
    const err = new PathTraversalError("../etc/passwd");
    expect(err.message).toContain("../etc/passwd");
  });

  it("FileConflictError のメッセージにパスが含まれる", () => {
    const err = new FileConflictError("index.ts");
    expect(err.message).toContain("index.ts");
  });
});
