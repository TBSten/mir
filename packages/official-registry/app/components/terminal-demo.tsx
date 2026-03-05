interface TerminalDemoProps {
  title?: string;
  lines: TerminalLine[];
}

type TerminalLine =
  | { type: "command"; prompt?: string; text: string }
  | { type: "output"; text: string }
  | { type: "tree"; text: string }
  | { type: "success"; text: string }
  | { type: "blank" };

export function TerminalDemo({ title, lines }: TerminalDemoProps) {
  return (
    <div class="w-full max-w-[720px] border border-sky-200 bg-sky-100">
      <div class="flex items-center gap-2 border-b border-sky-200 px-4 py-3">
        <span class="h-3 w-3 rounded-full bg-sky-300" />
        <span class="h-3 w-3 rounded-full bg-sky-200" />
        <span class="h-3 w-3 rounded-full bg-sky-200" />
        {title && (
          <span class="ml-2 font-mono text-xs text-sky-500">{title}</span>
        )}
      </div>
      <div class="space-y-0.5 px-5 py-4 font-mono text-sm leading-relaxed">
        {lines.map((line) => renderLine(line))}
      </div>
    </div>
  );
}

function renderLine(line: TerminalLine) {
  switch (line.type) {
    case "command":
      return (
        <div>
          <span class="text-sky-500">{line.prompt ?? "$"}</span>{" "}
          <span class="font-medium text-sky-900">{line.text}</span>
        </div>
      );
    case "output":
      return <div class="text-sky-600">{`  ${line.text}`}</div>;
    case "tree":
      return <div class="text-sky-600">{`  ${line.text}`}</div>;
    case "success":
      return (
        <div>
          {"  "}
          <span class="text-sky-500">{"[done]"}</span>{" "}
          <span class="text-sky-600">{line.text}</span>
        </div>
      );
    case "blank":
      return <div class="h-1" />;
  }
}

export type { TerminalLine };
