import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { SnippetComparisonTable } from "../../components/snippet-comparison-table.js";
import { staticProvider } from "../../lib/provider.js";

export default createRoute(async (c) => {
  // compare パラメータを取得
  const compareParam = c.req.query("compare") ?? "";

  // compare パラメータがない場合は通常の一覧ページにリダイレクト
  if (!compareParam) {
    return c.redirect("/snippets");
  }

  // カンマ区切りで snippet 名をパース
  const names = compareParam
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  // 重複を排除
  const uniqueNames = Array.from(new Set(names));

  // 各 snippet の詳細を取得
  const snippets = await Promise.all(
    uniqueNames.map((name) => staticProvider.get(name)),
  );

  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "snippets", href: "/snippets" },
          { label: `compare (${uniqueNames.length})` },
        ]}
      />

      {/* Title */}
      <div class="flex flex-col gap-3">
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          $ compare snippets
        </h1>
        <p class="font-body text-sm leading-relaxed text-sky-600">
          {`// comparing ${uniqueNames.length} snippet${uniqueNames.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Comparison Table */}
      <SnippetComparisonTable snippets={snippets} names={uniqueNames} />

      {/* Snippet Names */}
      <div class="flex flex-col gap-2 text-xs text-sky-500">
        <p class="font-mono font-bold">Snippets:</p>
        {uniqueNames.map((name) => (
          <a
            key={name}
            href={`/snippets/${encodeURIComponent(name)}`}
            class="font-mono text-sky-400 hover:text-sky-600 underline"
          >
            {name}
          </a>
        ))}
      </div>
    </div>,
    { title: "compare" },
  );
});
