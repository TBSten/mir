import type { Child } from "hono/jsx";

interface TagProps {
  children: Child;
}

export function Tag({ children }: TagProps) {
  return (
    <span class="border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-xs text-sky-600">
      {children}
    </span>
  );
}
