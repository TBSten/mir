import readline from "node:readline";

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
    // 質問を表示
    process.stderr.write(`${yellow}${bold}?${reset} ${question}\n`);

    // 選択肢を表示
    for (let i = 0; i < suggests.length; i++) {
      const isDefault = suggests[i] === defaultValue;
      const suffix = isDefault ? ` ${dim}(default)${reset}` : "";
      process.stderr.write(`  ${cyan}${i + 1})${reset} ${suggests[i]}${suffix}\n`);
    }
    if (allowManualInput) {
      process.stderr.write(`  ${cyan}0)${reset} その他 (手動入力)\n`);
    }

    // デフォルト値の案内
    if (defaultValue !== undefined) {
      const inSuggests = suggests.indexOf(defaultValue);
      const hint =
        inSuggests >= 0
          ? `Enter で ${defaultValue} を使用`
          : `Enter でデフォルト値 "${defaultValue}" を使用`;
      process.stderr.write(`${dim}${hint}${reset}\n`);
    }

    // 入力ループ
    while (true) {
      const input = await readLine(rl, `${bold}選択: ${reset}`);
      const trimmed = input.trim();

      // Enter のみ → default があればそれを返す
      if (trimmed === "" && defaultValue !== undefined) {
        return defaultValue;
      }

      const num = Number(trimmed);

      if (trimmed === "" || Number.isNaN(num)) {
        process.stderr.write("番号を入力してください\n");
        continue;
      }

      // 手動入力
      if (num === 0 && allowManualInput) {
        const manual = await readLine(rl, `${question}: `);
        return manual;
      }

      // 選択肢の範囲チェック
      if (num >= 1 && num <= suggests.length) {
        return suggests[num - 1];
      }

      process.stderr.write("番号を入力してください\n");
    }
  } finally {
    rl.close();
  }
}
