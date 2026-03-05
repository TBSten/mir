import readline from "node:readline";
import { t } from "@mir/core";

const yellow = "\x1b[33m";
const bold = "\x1b[1m";
const cyan = "\x1b[36m";
const dim = "\x1b[2m";
const reset = "\x1b[0m";

export function prompt(question: string): Promise<string> {
  const colored = question.replace(
    /^(.+?)\((\w+)\): $/,
    `${yellow}${bold}?${reset} $1${cyan}($2)${reset}: `,
  );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(colored, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function confirm(message: string): Promise<boolean> {
  const answer = await prompt(`${message} ${t("prompt.yes-no")}`);
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

export type OverwriteChoice = "yes" | "no" | "all";

export async function confirmOverwrite(filePath: string): Promise<OverwriteChoice> {
  const answer = await prompt(
    t("install.confirm-overwrite", { path: filePath }),
  );
  const trimmed = answer.toLowerCase().trim();
  if (trimmed === "a" || trimmed === "all") return "all";
  if (trimmed === "y" || trimmed === "yes") return "yes";
  return "no";
}

export interface SuggestsOptions {
  question: string;
  suggests: string[];
  allowManualInput: boolean;
  defaultValue?: string;
}

function readLine(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

export async function selectWithSuggests(
  opts: SuggestsOptions,
): Promise<string> {
  const { question, suggests, allowManualInput, defaultValue } = opts;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  try {
    process.stderr.write(`${yellow}${bold}?${reset} ${question}\n`);

    for (let i = 0; i < suggests.length; i++) {
      const isDefault = suggests[i] === defaultValue;
      const suffix = isDefault ? ` ${dim}${t("general.default")}${reset}` : "";
      process.stderr.write(`  ${cyan}${i + 1})${reset} ${suggests[i]}${suffix}\n`);
    }
    if (allowManualInput) {
      process.stderr.write(`  ${cyan}0)${reset} ${t("prompt.other-manual")}\n`);
    }

    if (defaultValue !== undefined) {
      const inSuggests = suggests.indexOf(defaultValue);
      const hint =
        inSuggests >= 0
          ? t("prompt.use-default", { value: defaultValue })
          : t("prompt.use-default-value", { value: defaultValue });
      process.stderr.write(`${dim}${hint}${reset}\n`);
    }

    while (true) {
      const input = await readLine(rl, `${bold}${t("prompt.select")}${reset}`);
      const trimmed = input.trim();

      if (trimmed === "" && defaultValue !== undefined) {
        return defaultValue;
      }

      const num = Number(trimmed);

      if (trimmed === "" || Number.isNaN(num)) {
        process.stderr.write(`${t("prompt.enter-number")}\n`);
        continue;
      }

      if (num === 0 && allowManualInput) {
        const manual = await readLine(rl, `${question}: `);
        return manual;
      }

      if (num >= 1 && num <= suggests.length) {
        return suggests[num - 1];
      }

      process.stderr.write(`${t("prompt.enter-number")}\n`);
    }
  } finally {
    rl.close();
  }
}
