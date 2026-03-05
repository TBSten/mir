const green = "\x1b[32m";
const cyan = "\x1b[36m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const dim = "\x1b[2m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

function write(msg: string): void {
  process.stderr.write(msg + "\n");
}

export function success(msg: string): void {
  write(`${green}${bold}✅ ${msg}${reset}`);
}

export function info(msg: string): void {
  write(`${cyan}ℹ️  ${msg}${reset}`);
}

export function warn(msg: string): void {
  write(`${yellow}⚠️  ${msg}${reset}`);
}

export function error(msg: string): void {
  write(`${red}${bold}❌ ${msg}${reset}`);
}

export function step(msg: string): void {
  write(`${cyan}▶ ${msg}${reset}`);
}

export function label(key: string, val: string): void {
  write(`  ${dim}${key}:${reset} ${val}`);
}

export function fileItem(filePath: string): void {
  write(`  ${dim}📄 ${filePath}${reset}`);
}

export function dirItem(dirPath: string): void {
  write(`  ${dim}📁 ${dirPath}${reset}`);
}
