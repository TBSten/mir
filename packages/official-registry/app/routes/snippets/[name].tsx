import { createRoute } from "honox/factory";
import { Breadcrumb } from "../../components/breadcrumb.js";
import { CodeBlock } from "../../components/code-block.js";
import { Tag } from "../../components/tag.js";
import { NotFoundError, renderError } from "../../lib/errors.js";
import { getProvider } from "../../lib/get-provider.js";
import { serializeSnippetYaml } from "@tbsten/mir-core";
import yaml from "js-yaml";
import { buildFileTree, type FileTreeNode } from "../../lib/file-tree.js";

export default createRoute(async (c) => {
  const name = c.req.param("name") ?? "";
  const provider = getProvider(c);
  const detail = await provider.get(name);

  if (!detail) {
    return renderError(c, new NotFoundError(`Snippet "${name}" not found`));
  }

  const { definition, files, authorizationStatus } = detail;
  const fileEntries = Array.from(files.entries());
  const filePaths = fileEntries.map(([p]) => p);

  const filesJson = JSON.stringify(Object.fromEntries(fileEntries));
  const variableDefs = definition.variables ?? {};
  const variableNames = Object.keys(variableDefs);
  const variableDefsJson = JSON.stringify(variableDefs);

  const hasHooks = !!(
    definition.hooks?.["before-install"]?.length ||
    definition.hooks?.["after-install"]?.length
  );

  const yamlCode = serializeSnippetYaml(definition);
  const hooksYaml: Record<string, string> = {};
  if (definition.hooks?.["before-install"]) {
    hooksYaml["before-install"] = yaml.dump(definition.hooks["before-install"]);
  }
  if (definition.hooks?.["after-install"]) {
    hooksYaml["after-install"] = yaml.dump(definition.hooks["after-install"]);
  }

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
          <AuthorizationBadge status={authorizationStatus} />
          <PopularityBadge name={name} />
        </div>
        {definition.description && (
          <p class="font-body text-sm leading-relaxed text-sky-600">
            {`// ${definition.description}`}
          </p>
        )}
      </div>

      {/* Authorization Warning */}
      {authorizationStatus && authorizationStatus !== "approved" && (
        <div class={`flex items-center gap-2 p-4 rounded border ${
          authorizationStatus === "rejected"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-yellow-50 border-yellow-200 text-yellow-700"
        }`}>
          <span class="font-mono text-sm">
            {authorizationStatus === "rejected"
              ? "このスニペットは審査により却下されました。利用にはご注意ください。"
              : "このスニペットはまだ審査中です。公式に承認されていません。"}
          </span>
        </div>
      )}

      {/* Install Section */}
      <div class="flex flex-col gap-3 p-4 bg-sky-50 rounded border border-sky-200">
        <p class="font-mono text-sm font-bold text-sky-700">$ Installation</p>
        <CodeBlock
          fileName="terminal"
          code={`npx @tbsten/mir install ${name} --registry=official`}
        />
        <p class="font-mono text-xs text-sky-600">// Add to your mirconfig.yaml</p>
        <CodeBlock
          fileName="mirconfig.yaml"
          code={`registries:\n  - name: official\n    url: https://mir.tbsten.me/registry`}
        />
      </div>

      {/* Dependencies */}
      {definition.dependencies && definition.dependencies.length > 0 && (
        <div class="flex flex-col gap-2" data-testid="dependencies-section">
          <p class="font-mono text-sm font-bold text-sky-700">Dependencies</p>
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

      {/* Variables */}
      {variableNames.length > 0 && (
        <div class="flex flex-wrap gap-2" data-testid="variables-section">
          {variableNames.map((v) => (
            <Tag key={v}>{v}</Tag>
          ))}
        </div>
      )}

      {/* Variable Preview */}
      {variableNames.length > 0 && (
        <div class="flex flex-col gap-3 p-4 bg-sky-50 rounded border border-sky-200">
          <p class="font-mono text-sm font-bold text-sky-700">Preview with variables</p>
          <div class="flex flex-wrap gap-3" id="variable-inputs">
            {variableNames.map((v) => (
              <label key={v} class="flex flex-col gap-1">
                <span class="font-mono text-xs text-sky-600">{`{{ ${v} }}`}</span>
                <input
                  type="text"
                  data-var-name={v}
                  placeholder={variableDefs[v]?.schema?.default?.toString() || v}
                  class="px-3 py-1.5 border border-sky-200 rounded font-mono text-sm text-sky-800 bg-white focus:outline-none focus:border-sky-400 w-48"
                />
              </label>
            ))}
          </div>
          <div id="preview-output" class="flex flex-col gap-2">
            <p class="font-mono text-xs text-sky-500">// Enter variable values to see expanded output</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div class="flex flex-col gap-6 lg:flex-row">
        {/* Left: Directory Tree */}
        <div class="lg:w-1/3 min-w-0">
          <div class="border border-sky-200 bg-white">
            <div class="border-b border-sky-200 px-4 py-2">
              <span class="font-mono text-xs text-sky-600">// directory_structure</span>
            </div>
            <div class="overflow-auto max-h-96 px-5 py-4 font-mono text-sm leading-relaxed" id="dir-tree">
              <div class="text-sky-600 mb-1 whitespace-nowrap">{name}/</div>
              <FileTreeView node={buildFileTree(filePaths)} prefix="" continuationPrefix="" isRoot={true} />
            </div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div class="flex-1 min-w-0">
          <div class="flex flex-col gap-4">
            {/* Tabs */}
            <div class="flex gap-0 border-b border-sky-200" id="detail-tabs">
              <button
                type="button"
                class="px-4 py-2 border-b-2 border-sky-400 text-sky-700 font-mono text-sm cursor-pointer"
                data-tab="files"
              >
                Files
              </button>
              <button
                type="button"
                class="px-4 py-2 border-b-2 border-transparent text-sky-400 hover:text-sky-600 font-mono text-sm cursor-pointer"
                data-tab="yaml"
              >
                snippet.yaml
              </button>
              {hasHooks && (
                <button
                  type="button"
                  class="px-4 py-2 border-b-2 border-transparent text-sky-400 hover:text-sky-600 font-mono text-sm cursor-pointer"
                  data-tab="hooks"
                >
                  Hooks
                </button>
              )}
            </div>

            {/* Tab: Files */}
            <div id="tab-files">
              <div id="file-viewer">
                {fileEntries.length > 0 ? (
                  <CodeBlock
                    id="active-file-code"
                    fileName={fileEntries[0][0]}
                    code={fileEntries[0][1]}
                  />
                ) : (
                  <p class="font-mono text-sm text-sky-400">No files</p>
                )}
              </div>
            </div>

            {/* Tab: YAML */}
            <div id="tab-yaml" style="display:none">
              <CodeBlock fileName="snippet.yaml" code={yamlCode} />
            </div>

            {/* Tab: Hooks */}
            {hasHooks && (
              <div id="tab-hooks" style="display:none">
                {hooksYaml["before-install"] && (
                  <div class="mb-4">
                    <h3 class="font-mono text-sm font-bold text-sky-700 mb-2">before-install</h3>
                    <CodeBlock fileName="hook" code={hooksYaml["before-install"]} />
                  </div>
                )}
                {hooksYaml["after-install"] && (
                  <div>
                    <h3 class="font-mono text-sm font-bold text-sky-700 mb-2">after-install</h3>
                    <CodeBlock fileName="hook" code={hooksYaml["after-install"]} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client-side interactivity */}
      <script dangerouslySetInnerHTML={{ __html: `
(function() {
  var snippetFiles = ${filesJson};
  var variableDefs = ${variableDefsJson};
  var filePaths = ${JSON.stringify(filePaths)};

  // --- Tab switching ---
  var tabButtons = document.querySelectorAll('#detail-tabs button[data-tab]');
  tabButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabName = this.getAttribute('data-tab');
      ['files', 'yaml', 'hooks'].forEach(function(t) {
        var el = document.getElementById('tab-' + t);
        if (el) el.style.display = (t === tabName) ? '' : 'none';
      });
      tabButtons.forEach(function(b) {
        var isActive = b.getAttribute('data-tab') === tabName;
        b.className = 'px-4 py-2 border-b-2 font-mono text-sm cursor-pointer ' +
          (isActive ? 'border-sky-400 text-sky-700' : 'border-transparent text-sky-400 hover:text-sky-600');
      });
    });
  });

  // --- File selection from directory tree ---
  var fileItems = document.querySelectorAll('#dir-tree [data-file-path]');
  fileItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var fp = this.getAttribute('data-file-path');
      var content = snippetFiles[fp];
      if (content === undefined) return;

      var viewer = document.getElementById('file-viewer');
      if (!viewer) return;

      var codeId = 'active-file-code';
      viewer.innerHTML =
        '<div class="border border-sky-200 bg-white">' +
          '<div class="flex items-center justify-between border-b border-sky-200 px-4 py-2">' +
            '<span class="font-mono text-xs text-sky-600">// ' + escapeHtml(fp) + '</span>' +
            '<button type="button" class="font-mono text-xs text-sky-400 hover:text-sky-600 cursor-pointer" id="copy-active-btn">[copy]</button>' +
          '</div>' +
          '<pre class="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-sky-800">' +
            '<code id="' + codeId + '">' + escapeHtml(content) + '</code>' +
          '</pre>' +
        '</div>';

      // Re-attach copy handler
      var copyBtn = document.getElementById('copy-active-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          var target = document.getElementById(codeId);
          if (target) {
            navigator.clipboard.writeText(target.textContent || '').then(function() {
              copyBtn.textContent = '[copied!]';
              setTimeout(function() { copyBtn.textContent = '[copy]'; }, 1500);
            });
          }
        });
      }

      // Highlight selected file
      fileItems.forEach(function(el) {
        if (el.getAttribute('data-file-path') === fp) {
          el.classList.add('bg-sky-100');
        } else {
          el.classList.remove('bg-sky-100');
        }
      });

      // Switch to files tab
      document.querySelector('#detail-tabs button[data-tab="files"]').click();
    });
  });

  // --- Variable preview ---
  var varInputs = document.querySelectorAll('#variable-inputs input[data-var-name]');
  varInputs.forEach(function(input) {
    input.addEventListener('input', updatePreview);
  });

  function updatePreview() {
    var vars = {};
    var hasValue = false;
    varInputs.forEach(function(input) {
      var val = input.value.trim();
      if (val) {
        vars[input.getAttribute('data-var-name')] = val;
        hasValue = true;
      }
    });

    var output = document.getElementById('preview-output');
    if (!output) return;

    if (!hasValue) {
      output.innerHTML = '<p class="font-mono text-xs text-sky-500">// Enter variable values to see expanded output</p>';
      return;
    }

    var html = '<p class="font-mono text-xs text-sky-600 mb-2">// Expanded file paths:</p>';
    filePaths.forEach(function(fp) {
      var expanded = expandTemplate(fp, vars);
      var changed = expanded !== fp;
      html += '<div class="font-mono text-sm ' + (changed ? 'text-sky-800' : 'text-sky-400') + ' whitespace-nowrap">' +
        escapeHtml(expanded) + '</div>';
    });
    output.innerHTML = html;
  }

  function expandTemplate(template, vars) {
    return template.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, function(match, key) {
      var k = key.trim();
      return (vars[k] !== undefined && vars[k] !== '') ? vars[k] : match;
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
` }} />
    </div>,
    {
      title: name,
      description:
        definition.description || "Code snippet details and installation guide",
      path: `/snippets/${name}`,
    },
  );
});

function AuthorizationBadge({ status }: { status?: string }) {
  if (!status || status === "approved") {
    if (status === "approved") {
      return (
        <span class="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono rounded border border-green-200">
          approved
        </span>
      );
    }
    return null;
  }
  if (status === "rejected") {
    return (
      <span class="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-mono rounded border border-red-200">
        rejected
      </span>
    );
  }
  return (
    <span class="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-mono rounded border border-yellow-200">
      examination
    </span>
  );
}

function FileTreeView({
  node,
  prefix,
  continuationPrefix,
  isRoot,
}: {
  node: FileTreeNode;
  /** この行自体に表示する接頭辞（例: "  ├── "） */
  prefix: string;
  /** 子要素に渡す継続用接頭辞（例: "  │   "） */
  continuationPrefix: string;
  isRoot: boolean;
}) {
  if (isRoot) {
    const count = node.children.length;
    return (
      <>
        {node.children.map((child, i) => {
          const isLast = i === count - 1;
          const connector = isLast ? "└── " : "├── ";
          const childContinuation = isLast ? "    " : "│   ";
          return (
            <FileTreeView
              key={child.fullPath ?? child.name}
              node={child}
              prefix={`  ${connector}`}
              continuationPrefix={`  ${childContinuation}`}
              isRoot={false}
            />
          );
        })}
      </>
    );
  }

  const isFile = !!node.fullPath;

  if (isFile) {
    return (
      <div
        class="cursor-pointer hover:bg-sky-50 text-sky-700 hover:text-sky-900 rounded transition-colors whitespace-nowrap w-fit min-w-full"
        data-file-path={node.fullPath}
      >
        <span class="text-sky-400 select-none whitespace-pre">{prefix}</span>
        {node.name}
      </div>
    );
  }

  // ディレクトリノード
  const count = node.children.length;
  return (
    <div>
      <div class="text-sky-600 whitespace-nowrap">
        <span class="text-sky-400 select-none whitespace-pre">{prefix}</span>
        {`${node.name}/`}
      </div>
      {node.children.map((child, i) => {
        const isLast = i === count - 1;
        const connector = isLast ? "└── " : "├── ";
        const childContinuation = isLast ? "    " : "│   ";
        return (
          <FileTreeView
            key={child.fullPath ?? child.name}
            node={child}
            prefix={`${continuationPrefix}${connector}`}
            continuationPrefix={`${continuationPrefix}${childContinuation}`}
            isRoot={false}
          />
        );
      })}
    </div>
  );
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
      <script dangerouslySetInnerHTML={{ __html: `
(async function() {
  try {
    var res = await fetch('/api/stats/${name}');
    var data = await res.json();
    var badge = document.getElementById('popularity-badge-${name}');
    if (badge) badge.textContent = '↓ ' + data.count;
  } catch (e) {}
})();
` }} />
    </>
  );
}
