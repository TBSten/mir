interface DirectoryTreeProps {
  title?: string;
  tree: string;
}

export function DirectoryTree({ title, tree }: DirectoryTreeProps) {
  return (
    <div class="border border-sky-200 bg-white">
      <div class="flex items-center justify-between border-b border-sky-200 px-4 py-2">
        <span class="font-mono text-xs text-sky-600">
          {`// ${title ?? "directory_structure"}`}
        </span>
        <button
          type="button"
          class="font-mono text-xs text-sky-400 hover:text-sky-600"
        >
          [copy]
        </button>
      </div>
      <pre class="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-sky-600">
        {tree}
      </pre>
    </div>
  );
}
