import { createRoute } from "honox/factory";
import { SearchInput } from "../../components/search-input.js";
import { SnippetCard } from "../../components/snippet-card.js";
import { staticProvider } from "../../lib/provider.js";

export default createRoute(async (c) => {
  const query = c.req.query("q") ?? "";
  const snippets = query
    ? await (staticProvider.search?.(query) ?? staticProvider.list())
    : await staticProvider.list();

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

      <div class="flex items-center justify-between">
        <p class="font-mono text-xs text-sky-400">
          {`// showing ${snippets.length} snippets`}
        </p>
      </div>

      {snippets.length === 0 ? (
        <div class="flex flex-col items-center gap-2 py-16">
          <p class="font-mono text-lg text-sky-300">// no results found</p>
          <p class="font-body text-sm text-sky-400">
            {`no snippets matching "${query}"`}
          </p>
        </div>
      ) : (
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {snippets.map((s) => (
            <SnippetCard name={s.name} description={s.description} />
          ))}
        </div>
      )}
    </div>,
    { title: "snippets" },
  );
});
