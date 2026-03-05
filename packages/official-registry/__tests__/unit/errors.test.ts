import { describe, it, expect } from "vitest";
import { AppError, NotFoundError } from "../../app/lib/errors.js";

describe("AppError", () => {
  it("デフォルト status code は 500", () => {
    const err = new AppError("test");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("test");
  });

  it("カスタム status code を設定できる", () => {
    const err = new AppError("bad request", 400);
    expect(err.statusCode).toBe(400);
  });

  it("Error を継承している", () => {
    const err = new AppError("test");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("status code が 404", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it("デフォルトメッセージがある", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Page not found");
  });

  it("カスタムメッセージを設定できる", () => {
    const err = new NotFoundError("Snippet not found");
    expect(err.message).toBe("Snippet not found");
  });

  it("AppError を継承している", () => {
    const err = new NotFoundError();
    expect(err).toBeInstanceOf(AppError);
  });
});
