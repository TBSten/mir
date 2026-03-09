interface CodeBlockProps {
  fileName?: string;
  code: string;
  id?: string;
}

export function CodeBlock({ fileName, code, id }: CodeBlockProps) {
  const codeId = id ?? `code-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div class="border border-sky-200 bg-white">
      {fileName && (
        <div class="flex items-center justify-between border-b border-sky-200 px-4 py-2">
          <span class="font-mono text-xs text-sky-600">
            {`// ${fileName}`}
          </span>
          <button
            type="button"
            class="font-mono text-xs text-sky-400 hover:text-sky-600 cursor-pointer"
            data-copy-target={codeId}
            onclick={`
              const target = document.getElementById('${codeId}');
              if (target) {
                navigator.clipboard.writeText(target.textContent || '').then(() => {
                  this.textContent = '[copied!]';
                  setTimeout(() => { this.textContent = '[copy]'; }, 1500);
                });
              }
            `}
          >
            [copy]
          </button>
        </div>
      )}
      <pre class="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-sky-800">
        <code id={codeId}>{code}</code>
      </pre>
    </div>
  );
}
