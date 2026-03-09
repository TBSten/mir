interface DirectoryTreeProps {
  title?: string;
  tree: string;
  /** ファイルパスのリスト（クリック可能にする場合） */
  filePaths?: string[];
  /** ファイル選択時のコールバック用 JS 関数名 */
  onSelectFn?: string;
}

export function DirectoryTree({ title, tree, filePaths, onSelectFn }: DirectoryTreeProps) {
  const treeId = `tree-${Math.random().toString(36).slice(2, 8)}`;

  if (filePaths && filePaths.length > 0 && onSelectFn) {
    return (
      <div class="border border-sky-200 bg-white">
        <div class="flex items-center justify-between border-b border-sky-200 px-4 py-2">
          <span class="font-mono text-xs text-sky-600">
            {`// ${title ?? "directory_structure"}`}
          </span>
        </div>
        <div class="px-5 py-4 font-mono text-sm leading-relaxed">
          <div class="text-sky-600 mb-1">{tree.split("\n")[0]}</div>
          {filePaths.map((fp, i) => {
            const isLast = i === filePaths.length - 1;
            const prefix = isLast ? "  └── " : "  ├── ";
            return (
              <div
                key={fp}
                class="cursor-pointer hover:bg-sky-50 text-sky-700 hover:text-sky-900 px-1 -mx-1 rounded transition-colors w-fit"
                data-file-path={fp}
                onclick={`${onSelectFn}('${fp.replace(/'/g, "\\'")}')`}
              >
                <span class="text-sky-400 select-none">{prefix}</span>{fp}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div class="border border-sky-200 bg-white">
      <div class="flex items-center justify-between border-b border-sky-200 px-4 py-2">
        <span class="font-mono text-xs text-sky-600">
          {`// ${title ?? "directory_structure"}`}
        </span>
        <button
          type="button"
          class="font-mono text-xs text-sky-400 hover:text-sky-600 cursor-pointer"
          onclick={`
            const pre = document.getElementById('${treeId}');
            if (pre) {
              navigator.clipboard.writeText(pre.textContent || '').then(() => {
                this.textContent = '[copied!]';
                setTimeout(() => { this.textContent = '[copy]'; }, 1500);
              });
            }
          `}
        >
          [copy]
        </button>
      </div>
      <pre id={treeId} class="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-sky-600">
        {tree}
      </pre>
    </div>
  );
}
