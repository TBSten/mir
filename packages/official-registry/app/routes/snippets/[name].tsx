import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";
import { DirectoryTree } from "../../components/directory-tree.js";
import { Tag } from "../../components/tag.js";
import { NotFoundError, renderError } from "../../lib/errors.js";
import { staticProvider } from "../../lib/provider.js";

export default createRoute(async (c) => {
  const name = c.req.param("name") ?? "";
  const detail = await staticProvider.get(name);

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
        <h1 class="font-mono text-2xl font-bold text-sky-900">
          {definition.name}
        </h1>
        {definition.description && (
          <p class="font-body text-sm leading-relaxed text-sky-600">
            {`// ${definition.description}`}
          </p>
        )}
      </div>

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
          <CodeBlock fileName={firstFileName} code={firstFileContent} />
        </div>
      </div>
    </div>,
    { title: name },
  );
});

function buildTree(root: string, paths: string[]): string {
  const lines: string[] = [`${root}/`];
  paths.forEach((path, i) => {
    const isLast = i === paths.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    lines.push(`  ${prefix}${path}`);
  });
  return lines.join("\n");
}
