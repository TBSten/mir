import { createRoute } from "honox/factory";
import { Badge } from "../components/badge.js";
import { SearchInput } from "../components/search-input.js";
import { SnippetCard } from "../components/snippet-card.js";
import { TerminalDemo } from "../components/terminal-demo.js";
import type { TerminalLine } from "../components/terminal-demo.js";
import { SITE_DESCRIPTION } from "../lib/constants.js";
import { staticProvider } from "../lib/provider.js";

const terminalLines: TerminalLine[] = [
  { type: "command", prompt: "$", text: "snpt install @tbsten/react-hooks" },
  { type: "output", text: "resolving dependencies..." },
  { type: "output", text: "downloading @tbsten/react-hooks@2.1.0" },
  { type: "output", text: "extracting files..." },
  { type: "blank" },
  { type: "success", text: "installed to ./src/hooks/" },
  { type: "blank" },
  { type: "tree", text: "src/hooks/" },
  { type: "tree", text: "├── use-debounce.ts" },
  { type: "tree", text: "├── use-local-storage.ts" },
  { type: "tree", text: "├── use-media-query.ts" },
  { type: "tree", text: "└── index.ts" },
];

export default createRoute(async (c) => {
  const snippets = await staticProvider.list();

  return c.render(
    <div class="flex flex-col">
      {/* Hero */}
      <section class="flex flex-col items-center gap-12 px-8 py-16 lg:px-32">
        <Badge>// open source cli tool</Badge>

        <div class="flex flex-col items-center gap-3">
          <h1 class="text-center font-mono text-4xl font-bold leading-tight text-sky-900 lg:text-5xl">
            share code snippets{"\n"}from your terminal
          </h1>
          <p class="max-w-xl text-center font-body text-sm leading-relaxed text-sky-600">
            {SITE_DESCRIPTION}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <a
            href="/docs"
            class="bg-sky-500 px-6 py-3 font-mono text-sm font-medium text-white hover:bg-sky-600"
          >
            $ snpt install snpt
          </a>
          <a
            href="/docs"
            class="font-mono text-sm text-sky-500 hover:text-sky-700"
          >
            {"view docs >>"}
          </a>
        </div>

        <TerminalDemo title="~/projects/my-app" lines={terminalLines} />
      </section>

      {/* Explore Snippets */}
      <section class="border-t border-sky-200 px-8 pt-12 lg:px-32">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-1">
            <p class="font-mono text-2xl font-bold text-sky-900">
              $ explore snippets
            </p>
            <p class="font-body text-xs text-sky-500">
              // discover and install community-shared code snippets
            </p>
          </div>

          <SearchInput />

          <div class="flex items-center gap-3 font-mono text-xs">
            <span class="text-sky-400">// filters:</span>
            <FilterButton active>all</FilterButton>
            <FilterButton>language</FilterButton>
            <FilterButton>category</FilterButton>
            <span class="text-sky-400">sort: popular</span>
          </div>
        </div>
      </section>

      {/* Snippet Grid */}
      <section class="px-8 pb-12 pt-6 lg:px-32">
        <div class="mb-4 flex items-center justify-between">
          <p class="font-mono text-xs text-sky-400">
            {`// showing ${snippets.length} snippets`}
          </p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {snippets.map((s) => (
            <SnippetCard
              name={s.name}
              description={s.description}
            />
          ))}
        </div>
      </section>
    </div>,
    { path: "/" },
  );
});

function FilterButton({
  children,
  active,
}: {
  children: any;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      class={`border px-3 py-1 font-mono text-xs ${
        active
          ? "border-sky-400 bg-sky-100 text-sky-700"
          : "border-sky-200 text-sky-500 hover:border-sky-300"
      }`}
    >
      {children}
    </button>
  );
}
