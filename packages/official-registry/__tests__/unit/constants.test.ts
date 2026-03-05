import { describe, it, expect } from "vitest";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  GITHUB_URL,
  INSTALL_COMMAND,
} from "../../app/lib/constants.js";

describe("constants", () => {
  it("SITE_NAME が定義されている", () => {
    expect(SITE_NAME).toBe("snpt");
  });

  it("SITE_DESCRIPTION が空でない", () => {
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it("GITHUB_URL が有効な URL", () => {
    expect(GITHUB_URL).toMatch(/^https:\/\/github\.com\//);
  });

  it("INSTALL_COMMAND が定義されている", () => {
    expect(INSTALL_COMMAND.length).toBeGreaterThan(0);
  });
});
