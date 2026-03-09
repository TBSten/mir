import type { Command } from "commander";
import http from "node:http";
import { loadMirConfig } from "../lib/mirconfig.js";
import { saveRegistryToken } from "../lib/mirconfig.js";
import * as logger from "../lib/logger.js";

export function registerLoginCommand(program: Command): void {
  program
    .command("login")
    .description("registry にログインして publish token を取得")
    .option("--registry <name>", "対象 registry 名 (デフォルト: official)")
    .action(async (opts) => {
      const registryName = opts.registry || "official";
      const config = loadMirConfig();
      const registry = config.registries.find((r) => r.name === registryName);

      if (!registry?.url) {
        logger.error(`Registry "${registryName}" が見つからないか、URL が設定されていません`);
        process.exit(1);
      }

      const registryUrl = registry.url;
      logger.info(`${registryName} (${registryUrl}) にログインします...`);

      try {
        const { token, username } = await startLoginFlow(registryUrl);
        saveRegistryToken(registryName, token);
        logger.success(`ログイン成功: ${username}`);
        logger.info("publish token が設定に保存されました");
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`ログイン失敗: ${error.message}`);
        }
        process.exit(1);
      }
    });
}

interface LoginResult {
  token: string;
  username: string;
}

async function startLoginFlow(registryUrl: string): Promise<LoginResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost`);

      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token");
        const username = url.searchParams.get("username");

        if (token && username) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html>
              <body style="font-family: monospace; text-align: center; padding: 40px;">
                <h1>ログイン成功!</h1>
                <p>${username} としてログインしました。</p>
                <p>このウィンドウは閉じて構いません。</p>
              </body>
            </html>
          `);

          server.close();
          resolve({ token, username });
        } else {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><body><h1>ログイン失敗</h1></body></html>");
          server.close();
          reject(new Error("トークンの取得に失敗しました"));
        }
        return;
      }

      res.writeHead(404);
      res.end();
    });

    // ランダムポートでリッスン
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("サーバーの起動に失敗しました"));
        return;
      }

      const port = addr.port;
      const loginUrl = `${registryUrl}/auth/login?cli=true&callback_port=${port}`;

      logger.info(`ブラウザを開いています: ${loginUrl}`);
      openBrowser(loginUrl);

      // 5 分タイムアウト
      setTimeout(() => {
        server.close();
        reject(new Error("ログインがタイムアウトしました"));
      }, 5 * 60 * 1000);
    });

    server.on("error", (err) => {
      reject(new Error(`サーバーエラー: ${err.message}`));
    });
  });
}

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import("node:child_process");
  const platform = process.platform;

  const command =
    platform === "darwin"
      ? `open "${url}"`
      : platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (err) => {
    if (err) {
      logger.info(`ブラウザを自動で開けませんでした。以下の URL を手動で開いてください:`);
      logger.info(url);
    }
  });
}
