import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";
import { DirectoryTree } from "../../components/directory-tree.js";
import { Tag } from "../../components/tag.js";
import { NotFoundError, renderError } from "../../lib/errors.js";
import { getProvider } from "../../lib/get-provider.js";
import { serializeSnippetYaml } from "@tbsten/mir-core";
import { GITHUB_ISSUES_URL } from "../../lib/constants.js";
import yaml from "js-yaml";

export default createRoute(async (c) => {
  const name = c.req.param("name") ?? "";
  const provider = getProvider(c);
  const detail = await provider.get(name);

  if (!detail) {
    return renderError(c, new NotFoundError(`Snippet "${name}" not found`));
  }

  const { definition, files } = detail;
  const fileEntries = Array.from(files.entries());

  // ディレクトリツリーを生成
  const tree = buildTree(name, fileEntries.map(([path]) => path));

  // 最初のファイルをデフォルトで表示
  const [firstFileName, firstFileContent] = fileEntries[0] ?? ["", ""];

  return c.render(
    <div class="flex flex-col gap-8 px-8 py-8 lg:px-32">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "snippets", href: "/snippets" },
          { label: name },
        ]}
      />

      {/* Title & Description */}
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <h1 class="font-mono text-2xl font-bold text-sky-900">
            {definition.name}
          </h1>
          {definition.version && (
            <a
              href={`/snippets/${encodeURIComponent(name)}/versions`}
              class="font-mono text-sm text-sky-400 hover:text-sky-600 border border-sky-200 hover:border-sky-400 px-2 py-0.5"
              title="View version history"
            >
              {`v${definition.version}`}
            </a>
          )}
          <PopularityBadge name={name} />
        </div>
        {definition.description && (
          <p class="font-body text-sm leading-relaxed text-sky-600">
            {`// ${definition.description}`}
          </p>
        )}
      </div>

      {/* Install Section */}
      <div class="flex flex-col gap-3 p-4 bg-sky-50 rounded border border-sky-200">
        <p class="font-mono text-sm font-bold text-sky-700">
          $ Installation
        </p>
        <CodeBlock
          fileName="terminal"
          code={`npx @tbsten/mir install ${name} --registry=official`}
        />
        <p class="font-mono text-xs text-sky-600">
          // Add to your mirconfig.yaml
        </p>
        <CodeBlock
          fileName="mirconfig.yaml"
          code={`registries:
  - name: official
    url: https://mir.tbsten.me/registry`}
        />
      </div>

      {/* Dependencies */}
      {definition.dependencies && definition.dependencies.length > 0 && (
        <div class="flex flex-col gap-2" data-testid="dependencies-section">
          <p class="font-mono text-sm font-bold text-sky-700">
            Dependencies
          </p>
          <div class="flex flex-wrap gap-2">
            {definition.dependencies.map((dep) => (
              <a
                key={dep}
                href={`/snippets/${dep}`}
                class="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm rounded font-mono transition-colors"
              >
                {dep}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {definition.variables && Object.keys(definition.variables).length > 0 && (
        <div class="flex flex-wrap gap-2" data-testid="variables-section">
          {Object.keys(definition.variables).map((v) => (
            <Tag>{v}</Tag>
          ))}
        </div>
      )}

      {/* Content */}
      <div class="flex flex-col gap-6 lg:flex-row">
        {/* Left: Directory Tree */}
        <div class="lg:w-1/3">
          <DirectoryTree tree={tree} />
        </div>

        {/* Right: Code Viewer */}
        <div class="flex-1">
          <div class="flex flex-col gap-4">
            {/* Tabs */}
            <div class="flex gap-2 border-b border-sky-200">
              <button class="px-4 py-2 border-b-2 border-sky-400 text-sky-700 font-mono text-sm">
                Files
              </button>
              <button class="px-4 py-2 border-b-2 border-transparent text-sky-400 hover:text-sky-600 font-mono text-sm">
                snippet.yaml
              </button>
              {definition.hooks && (
                <button class="px-4 py-2 border-b-2 border-transparent text-sky-400 hover:text-sky-600 font-mono text-sm">
                  Hooks
                </button>
              )}
            </div>

            {/* File Content */}
            <CodeBlock fileName={firstFileName} code={firstFileContent} />

            {/* YAML Preview */}
            <div class="hidden">
              <CodeBlock
                fileName="snippet.yaml"
                code={serializeSnippetYaml(definition)}
              />
            </div>

            {/* Hooks Display */}
            {definition.hooks && (
              <div class="hidden flex flex-col gap-4">
                {definition.hooks["before-install"] && (
                  <div>
                    <h3 class="font-mono text-sm font-bold text-sky-700 mb-2">
                      before-install
                    </h3>
                    <CodeBlock
                      fileName="hook"
                      code={yaml.dump(definition.hooks["before-install"])}
                    />
                  </div>
                )}
                {definition.hooks["after-install"] && (
                  <div>
                    <h3 class="font-mono text-sm font-bold text-sky-700 mb-2">
                      after-install
                    </h3>
                    <CodeBlock
                      fileName="hook"
                      code={yaml.dump(definition.hooks["after-install"])}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    {
      title: name,
      description:
        definition.description || "Code snippet details and installation guide",
      path: `/snippets/${name}`,
    },
  );
});

// Note: The PopularityBadge is rendered server-side but stats are loaded client-side

function buildTree(root: string, paths: string[]): string {
  const lines: string[] = [`${root}/`];
  paths.forEach((path, i) => {
    const isLast = i === paths.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    lines.push(`  ${prefix}${path}`);
  });
  return lines.join("\n");
}

function PopularityBadge({ name }: { name: string }) {
  return (
    <>
      <div
        class="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-mono rounded"
        id={`popularity-badge-${name}`}
      >
        ↓ --
      </div>
      <script>{`
(async () => {
  try {
    const res = await fetch('/api/stats/${name}');
    const data = await res.json();
    const badge = document.getElementById('popularity-badge-${name}');
    if (badge) {
      badge.textContent = \`↓ \${data.count}\`;
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
})();
`}</script>
    </>
  );
}
