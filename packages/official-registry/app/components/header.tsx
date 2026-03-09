import { GITHUB_URL, SITE_NAME } from "../lib/constants.js";

export function Header({ username }: { username?: string }) {
  return (
    <header class="flex items-center justify-between border-b border-sky-200 px-10 py-5">
      <a href="/" class="flex items-center gap-2">
        <span class="font-mono text-xl font-bold text-sky-600">{">"}</span>
        <span class="font-mono text-lg font-medium text-sky-900">
          {SITE_NAME}
        </span>
      </a>
      <nav class="flex items-center gap-8">
        <a
          href="/docs"
          class="font-mono text-sm text-sky-700 hover:text-sky-500"
        >
          docs
        </a>
        <a
          href="/snippets"
          class="font-mono text-sm text-sky-700 hover:text-sky-500"
        >
          snippets
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-sm text-sky-700 hover:text-sky-500"
        >
          github
        </a>
        {username ? (
          <>
            <a
              href="/settings/tokens"
              class="font-mono text-sm text-sky-700 hover:text-sky-500"
            >
              {username}
            </a>
            <form method="post" action="/auth/logout" style="display:inline">
              <button
                type="submit"
                class="font-mono text-xs text-sky-500 hover:text-sky-700"
              >
                logout
              </button>
            </form>
          </>
        ) : (
          <a
            href="/auth/login"
            class="flex items-center gap-2 bg-sky-500 px-4 py-2 font-mono text-xs font-medium text-white hover:bg-sky-600"
          >
            $ login
          </a>
        )}
      </nav>
    </header>
  );
}
