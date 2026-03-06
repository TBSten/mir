import { describe, it, expect, beforeEach, vi } from "vitest";
import * as logger from "../../lib/logger.js";

describe("logger level management", () => {
  beforeEach(() => {
    // テスト前にレベルをリセット（将来的な実装に対応）
    if ("setLogLevel" in logger) {
      (logger as any).setLogLevel("info");
    }
    // stderr を mock
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  it("should log info by default", () => {
    const writeSpy = vi.spyOn(process.stderr, "write");
    logger.info("test message");
    expect(writeSpy).toHaveBeenCalled();
  });

  it("should suppress info when level is error", () => {
    // TODO: logger に setLogLevel() 実装後に有効化
    // logger.setLogLevel('error');
    // const writeSpy = vi.spyOn(process.stderr, 'write');
    // logger.info('test message');
    // expect(writeSpy).not.toHaveBeenCalled();
  });

  it("should always log error", () => {
    const writeSpy = vi.spyOn(process.stderr, "write");
    logger.error("error message");
    expect(writeSpy).toHaveBeenCalled();
  });

  it("should log all levels when set to debug", () => {
    // TODO: logger に setLogLevel() 実装後に有効化
    // logger.setLogLevel('debug');
    // const writeSpy = vi.spyOn(process.stderr, 'write');
    //
    // logger.info('info');
    // logger.warn('warn');
    // logger.error('error');
    //
    // expect(writeSpy).toHaveBeenCalledTimes(3);
  });

  it("should suppress warn when level is error", () => {
    // TODO: logger に setLogLevel() 実装後に有効化
    // logger.setLogLevel('error');
    // const writeSpy = vi.spyOn(process.stderr, 'write');
    //
    // logger.warn('warning');
    // logger.error('error');
    //
    // expect(writeSpy).toHaveBeenCalledTimes(1); // error のみ
  });
});
