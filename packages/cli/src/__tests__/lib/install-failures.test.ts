import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  loadInstallFailures,
  saveInstallFailures,
  clearInstallFailures,
  getFailedSnippetNames,
  type FailedSnippetEntry,
} from "../../lib/install-failures.js";

describe("install-failures", () => {
  const testFilePath = path.join(process.cwd(), ".mir-test-failures.json");

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe("loadInstallFailures", () => {
    it("returns empty array when file does not exist", () => {
      const result = loadInstallFailures(testFilePath);
      expect(result).toEqual([]);
    });

    it("loads failures from file", () => {
      const entries: FailedSnippetEntry[] = [
        { name: "snippet-a", error: "Not found", timestamp: 123456 },
        { name: "snippet-b", error: "Invalid", timestamp: 123457 },
      ];
      saveInstallFailures(entries, testFilePath);

      const result = loadInstallFailures(testFilePath);
      expect(result).toEqual(entries);
    });

    it("returns empty array if file is invalid", () => {
      fs.writeFileSync(testFilePath, "invalid json", "utf-8");
      const result = loadInstallFailures(testFilePath);
      expect(result).toEqual([]);
    });
  });

  describe("saveInstallFailures", () => {
    it("creates directory if it does not exist", () => {
      const testDir = path.join(process.cwd(), ".mir-test-save");
      const testFile = path.join(testDir, "failures.json");
      const entries: FailedSnippetEntry[] = [
        { name: "test", error: "Test error", timestamp: 123 },
      ];

      saveInstallFailures(entries, testFile);

      expect(fs.existsSync(testFile)).toBe(true);
      const content = JSON.parse(fs.readFileSync(testFile, "utf-8"));
      expect(content.version).toBe(1);
      expect(content.entries).toEqual(entries);

      fs.rmSync(testDir, { recursive: true });
    });

    it("saves entries in correct format", () => {
      const entries: FailedSnippetEntry[] = [
        { name: "snippet-x", error: "Error message", timestamp: 999 },
      ];
      saveInstallFailures(entries, testFilePath);

      const content = JSON.parse(fs.readFileSync(testFilePath, "utf-8"));
      expect(content).toEqual({
        version: 1,
        entries,
      });
    });
  });

  describe("clearInstallFailures", () => {
    it("deletes the failures file", () => {
      const entries: FailedSnippetEntry[] = [
        { name: "snippet", error: "Error", timestamp: 123 },
      ];
      saveInstallFailures(entries, testFilePath);

      expect(fs.existsSync(testFilePath)).toBe(true);
      clearInstallFailures(testFilePath);
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    it("does nothing if file does not exist", () => {
      expect(() => {
        clearInstallFailures(testFilePath);
      }).not.toThrow();
    });
  });

  describe("getFailedSnippetNames", () => {
    it("returns empty array when no failures", () => {
      const result = getFailedSnippetNames(testFilePath);
      expect(result).toEqual([]);
    });

    it("returns only the snippet names", () => {
      const entries: FailedSnippetEntry[] = [
        { name: "snippet-a", error: "Error 1", timestamp: 1 },
        { name: "snippet-b", error: "Error 2", timestamp: 2 },
        { name: "snippet-c", error: "Error 3", timestamp: 3 },
      ];
      saveInstallFailures(entries, testFilePath);

      const result = getFailedSnippetNames(testFilePath);
      expect(result).toEqual(["snippet-a", "snippet-b", "snippet-c"]);
    });
  });
});
