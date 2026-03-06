import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../../components/breadcrumb.js";
import { NotFoundError, renderError } from "../../../lib/errors.js";
import { staticProvider } from "../../../lib/provider.js";

export default createRoute(async (c) => {
  const name = c.req.param("name") ?? "";
  const detail = await staticProvider.get(name);

  if (!detail) {
    return renderError(c, new NotFoundError(`Snippet "${name}" not found`));
  }

  const history = await staticProvider.getVersionHistory!(name) ?? [];

  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "snippets", href: "/snippets" },
          { label: name, href: `/snippets/${name}` },
          { label: "versions" },
        ]}
      />

      {/* Title */}
      <div class="flex flex-col gap-2">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          {`$ version history`}
        </h1>
        <p class="font-body text-xs text-sky-500">
          {`// ${name} — ${history.length} release${history.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Version List */}
      {history.length === 0 ? (
        <div class="flex flex-col items-center gap-4 py-16">
          <p class="font-mono text-lg text-sky-300">// no version history</p>
          <p class="font-body text-sm text-sky-400">
            This snippet has no recorded version history yet.
          </p>
        </div>
      ) : (
        <ol class="flex flex-col gap-4">
          {history.map((entry, index) => (
            <li
              key={entry.version}
              class="flex flex-col gap-1 border border-sky-200 bg-white p-5"
            >
              <div class="flex items-center gap-3">
                <span class="font-mono text-sm font-bold text-sky-900">
                  {entry.version}
                </span>
                {index === 0 && (
                  <span class="font-mono text-xs text-sky-400 border border-sky-200 px-2 py-0.5">
                    latest
                  </span>
                )}
              </div>
              {entry.publishedAt && (
                <p class="font-mono text-xs text-sky-400">
                  {`// published: ${entry.publishedAt}`}
                </p>
              )}
              {entry.description && (
                <p class="font-body text-xs text-sky-600 leading-relaxed">
                  {entry.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Back Link */}
      <a
        href={`/snippets/${encodeURIComponent(name)}`}
        class="font-mono text-sm text-sky-400 hover:text-sky-600 underline"
      >
        {"$ back to snippet"}
      </a>
    </div>,
    {
      title: `${name} - version history`,
      description: `Version history for ${name} snippet`,
      path: `/snippets/${name}/versions`,
    },
  );
});
