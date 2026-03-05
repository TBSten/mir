import type { Child } from "hono/jsx";

interface BadgeProps {
  children: Child;
}

export function Badge({ children }: BadgeProps) {
  return (
    <span class="inline-flex items-center gap-2 border border-sky-200 px-3 py-1.5">
      <span class="h-1.5 w-1.5 rounded-full bg-sky-500" />
      <span class="font-body text-xs text-sky-700">{children}</span>
    </span>
  );
}
