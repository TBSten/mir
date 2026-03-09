/**
 * /settings/tokens - API token 管理ページ
 */
import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import { verifyJwt } from "../../lib/auth.js";

export default createRoute(async (c) => {
  const authSecret = (c.env as any)?.AUTH_SECRET;
  const sessionToken = getCookie(c, "mir_session");

  if (!authSecret || !sessionToken) {
    return c.redirect("/auth/login");
  }

  const user = await verifyJwt(sessionToken, authSecret);
  if (!user) {
    return c.redirect("/auth/login");
  }

  const db = (c.env as any)?.D1 as D1Database | undefined;
  let tokens: Array<{ id: number; name: string; last_used: string | null; created_at: string }> = [];

  if (db) {
    const result = await db
      .prepare(
        "SELECT id, name, last_used, created_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC",
      )
      .bind(user.sub)
      .all();
    tokens = result.results as any;
  }

  return c.render(
    <div class="mx-auto max-w-3xl px-6 py-12">
      <h1 class="mb-8 font-mono text-2xl font-bold text-sky-900">API Tokens</h1>

      <div class="mb-8 border border-sky-200 bg-white p-6">
        <h2 class="mb-4 font-mono text-lg font-medium text-sky-800">
          新しいトークンを発行
        </h2>
        <form id="create-token-form" class="flex gap-4">
          <input
            type="text"
            name="token-name"
            placeholder="Token name (e.g. my-ci)"
            class="flex-1 border border-sky-200 px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            class="bg-sky-500 px-4 py-2 font-mono text-sm text-white hover:bg-sky-600"
          >
            発行
          </button>
        </form>
        <div
          id="new-token-display"
          class="mt-4 hidden border border-green-300 bg-green-50 p-4"
        >
          <p class="mb-2 font-mono text-sm text-green-800">
            トークンが発行されました。この値は一度だけ表示されます:
          </p>
          <code id="new-token-value" class="block break-all font-mono text-sm font-bold text-green-900" />
        </div>
      </div>

      <div class="border border-sky-200 bg-white">
        <h2 class="border-b border-sky-200 px-6 py-4 font-mono text-lg font-medium text-sky-800">
          既存のトークン
        </h2>
        {tokens.length === 0 ? (
          <p class="px-6 py-8 text-center font-mono text-sm text-sky-500">
            トークンがありません
          </p>
        ) : (
          <ul>
            {tokens.map((t) => (
              <li class="flex items-center justify-between border-b border-sky-100 px-6 py-4 last:border-b-0">
                <div>
                  <span class="font-mono text-sm font-medium text-sky-900">
                    {t.name}
                  </span>
                  <span class="ml-4 font-mono text-xs text-sky-500">
                    作成: {t.created_at}
                  </span>
                  {t.last_used && (
                    <span class="ml-4 font-mono text-xs text-sky-500">
                      最終使用: {t.last_used}
                    </span>
                  )}
                </div>
                <button
                  class="delete-token-btn font-mono text-xs text-red-500 hover:text-red-700"
                  data-token-id={String(t.id)}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.getElementById('create-token-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = e.target.querySelector('[name="token-name"]').value || 'API Token';
            const res = await fetch('/api/auth/tokens', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name }),
            });
            if (res.ok) {
              const data = await res.json();
              document.getElementById('new-token-value').textContent = data.token;
              document.getElementById('new-token-display').classList.remove('hidden');
              setTimeout(() => location.reload(), 3000);
            }
          });

          document.querySelectorAll('.delete-token-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.tokenId;
              if (!confirm('このトークンを削除しますか？')) return;
              const res = await fetch('/api/auth/tokens/' + id, { method: 'DELETE' });
              if (res.ok) location.reload();
            });
          });
        `,
        }}
      />
    </div>,
    { title: "API Tokens" },
  );
});
