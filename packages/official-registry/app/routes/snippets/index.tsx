import { createRoute } from "honox/factory";
import { SearchInput } from "../../components/search-input.js";
import { SnippetCard } from "../../components/snippet-card.js";
import { getProvider } from "../../lib/get-provider.js";
import { GITHUB_ISSUES_URL } from "../../lib/constants.js";

const DEFAULT_PAGE_SIZE = 20;

export default createRoute(async (c) => {
  try {
    const query = c.req.query("q") ?? "";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
    const limit = DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    const provider = getProvider(c);
    const allSnippets = await provider.list();
    const all = query
      ? allSnippets.filter(
          (s) =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            (s.description?.toLowerCase().includes(query.toLowerCase()) ?? false),
        )
      : allSnippets;

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const snippets = all.slice(offset, offset + limit);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/snippets${qs ? `?${qs}` : ""}`;
  };

  return c.render(
    <div class="flex flex-col gap-6 px-8 py-12 lg:px-32">
      <div class="flex flex-col gap-1">
        <p class="font-mono text-2xl font-bold text-sky-900">
          $ explore snippets
        </p>
        <p class="font-body text-xs text-sky-500">
          // discover and install community-shared code snippets
        </p>
      </div>

      <form method="get" action="/snippets">
        <SearchInput value={query} />
      </form>

      <div class="flex items-center justify-between gap-4">
        <p class="font-mono text-xs text-sky-400">
          {query
            ? `// showing ${snippets.length} of ${total} results for "${query}"`
            : `// showing ${offset + 1}–${Math.min(offset + limit, total)} of ${total} snippets`}
        </p>
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs text-sky-400">
            tip: compare snippets?
          </span>
          <a
            href="/snippets?compare=react-hook,react-component"
            class="font-mono text-xs text-sky-400 hover:text-sky-600 underline"
          >
            example
          </a>
        </div>
      </div>

      {snippets.length === 0 ? (
        <div class="flex flex-col items-center gap-4 py-16">
          <p class="font-mono text-lg text-sky-300">// no results found</p>
          <p class="font-body text-sm text-sky-400">
            {`no snippets matching "${query}"`}
          </p>
          {query && (
            <div class="flex flex-col items-center gap-2">
              <a
                href="/snippets"
                class="text-sky-400 hover:text-sky-300 underline text-sm"
              >
                Clear Search
              </a>
              <span class="text-sky-600 text-xs">or</span>
              <a
                href={GITHUB_ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sky-400 hover:text-sky-300 underline text-sm"
              >
                Submit a Request (GitHub)
              </a>
            </div>
          )}
        </div>
      ) : (
        <>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {snippets.map((s) => (
              <SnippetCard
                name={s.name}
                version={s.version}
                description={s.description}
              />
            ))}
          </div>

          {/* Pagination (件数が PAGE_SIZE を超えた場合のみ表示) */}
          {totalPages > 1 && (
            <nav
              class="flex items-center justify-center gap-4 pt-4"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <a
                  href={buildPageUrl(page - 1)}
                  class="font-mono text-sm text-sky-400 hover:text-sky-600 underline"
                >
                  {"< prev"}
                </a>
              ) : (
                <span class="font-mono text-sm text-sky-200">{"< prev"}</span>
              )}

              <p class="font-mono text-xs text-sky-500">
                {`page ${page} / ${totalPages}`}
              </p>

              {page < totalPages ? (
                <a
                  href={buildPageUrl(page + 1)}
                  class="font-mono text-sm text-sky-400 hover:text-sky-600 underline"
                >
                  {"next >"}
                </a>
              ) : (
                <span class="font-mono text-sm text-sky-200">{"next >"}</span>
              )}
            </nav>
          )}
        </>
      )}
    </div>,
    {
      title: "snippets",
      description: "Discover and install community-shared code snippets",
      path: "/snippets",
    },
  );
  } catch (error) {
    console.error("Error loading snippets:", error);
    return c.render(
      <div class="flex flex-col gap-6 px-8 py-12 lg:px-32">
        <div class="flex flex-col gap-1">
          <p class="font-mono text-2xl font-bold text-red-900">
            $ error loading snippets
          </p>
          <p class="font-body text-xs text-red-500">
            // failed to load snippet data
          </p>
        </div>
        <div class="flex flex-col items-center gap-4 py-16">
          <p class="font-mono text-lg text-red-300">// service error</p>
          <p class="font-body text-sm text-red-400">
            Please try again later
          </p>
          <a
            href="/"
            class="text-red-400 hover:text-red-300 underline text-sm"
          >
            Back to Home
          </a>
        </div>
      </div>,
      {
        title: "snippets - error",
        description: "Error loading snippets",
        path: "/snippets",
      },
    );
  }
});
