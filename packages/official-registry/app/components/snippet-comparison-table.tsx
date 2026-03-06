import type { RegistrySnippetDetail } from "@mir/registry-sdk";
import { Tag } from "./tag.js";

interface SnippetComparisonTableProps {
  snippets: (RegistrySnippetDetail | null)[];
  names: string[];
}

export function SnippetComparisonTable({
  snippets,
  names,
}: SnippetComparisonTableProps) {
  // 各属性の行を定義
  const rows = [
    {
      label: "Description",
      key: "description",
      render: (detail: RegistrySnippetDetail | null) =>
        detail?.definition.description || "—",
    },
    {
      label: "Tags",
      key: "tags",
      render: (detail: RegistrySnippetDetail | null) => {
        const tags = detail?.definition.tags ?? [];
        return tags.length > 0 ? (
          <div class="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Tag>{tag}</Tag>
            ))}
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      label: "Variables",
      key: "variables",
      render: (detail: RegistrySnippetDetail | null) => {
        const vars = detail?.definition.variables ?? {};
        const varNames = Object.keys(vars);
        return varNames.length > 0 ? (
          <div class="flex flex-wrap gap-1">
            {varNames.map((varName) => (
              <Tag>{varName}</Tag>
            ))}
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      label: "Files",
      key: "files",
      render: (detail: RegistrySnippetDetail | null) => {
        const files = detail?.files ?? new Map();
        const fileNames = Array.from(files.keys());
        return fileNames.length > 0 ? (
          <div class="flex flex-col gap-1">
            {fileNames.map((fileName) => (
              <span class="font-mono text-xs text-sky-600">{fileName}</span>
            ))}
          </div>
        ) : (
          "—"
        );
      },
    },
  ];

  return (
    <div
      class="w-full overflow-x-auto border border-sky-200 bg-white"
      data-testid="comparison-table"
    >
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-sky-200 bg-sky-50">
            <th class="border-r border-sky-200 px-4 py-3 text-left font-mono text-sm font-bold text-sky-900">
              Property
            </th>
            {names.map((name) => (
              <th
                key={name}
                class="border-r border-sky-200 px-4 py-3 text-left font-mono text-sm font-bold text-sky-900 last:border-r-0"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.key}
              class={
                rowIndex % 2 === 0
                  ? "border-b border-sky-200 bg-white"
                  : "border-b border-sky-200 bg-sky-50"
              }
            >
              <td class="border-r border-sky-200 px-4 py-3 font-mono text-sm font-bold text-sky-700">
                {row.label}
              </td>
              {snippets.map((detail, idx) => (
                <td
                  key={`${row.key}-${idx}`}
                  class="border-r border-sky-200 px-4 py-3 text-sm text-sky-600 last:border-r-0"
                >
                  {row.render(detail)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
