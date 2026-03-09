import { describe, it, expect } from "vitest";
import { Command } from "commander";
import { registerListCommand } from "../../commands/list.js";
import { registerCreateCommand } from "../../commands/create.js";
import { registerSyncCommand } from "../../commands/sync.js";
import { registerSearchCommand } from "../../commands/search.js";
import { registerInstallCommand } from "../../commands/install.js";
import { registerValidateCommand } from "../../commands/validate.js";

function createProgram(
  register: (program: Command) => void,
): Command {
  const program = new Command();
  program.exitOverride();
  register(program);
  return program;
}

function getAliases(program: Command, commandName: string): string[] {
  const cmd = program.commands.find((c) => c.name() === commandName);
  return cmd?.aliases() ?? [];
}

describe("コマンドエイリアス", () => {
  it("list コマンドに l エイリアスがある", () => {
    const program = createProgram(registerListCommand);
    const aliases = getAliases(program, "list");
    expect(aliases).toContain("l");
    expect(aliases).toContain("ls");
  });

  it("create コマンドに c エイリアスがある", () => {
    const program = createProgram(registerCreateCommand);
    const aliases = getAliases(program, "create");
    expect(aliases).toContain("c");
  });

  it("sync コマンドに s エイリアスがある", () => {
    const program = createProgram(registerSyncCommand);
    const aliases = getAliases(program, "sync");
    expect(aliases).toContain("s");
  });

  it("search コマンドに q エイリアスがある", () => {
    const program = createProgram(registerSearchCommand);
    const aliases = getAliases(program, "search");
    expect(aliases).toContain("q");
  });

  it("install コマンドに i エイリアスがある", () => {
    const program = createProgram(registerInstallCommand);
    const aliases = getAliases(program, "install");
    expect(aliases).toContain("i");
  });

  it("validate コマンドに v エイリアスがある", () => {
    const program = createProgram(registerValidateCommand);
    const aliases = getAliases(program, "validate");
    expect(aliases).toContain("v");
  });
});
