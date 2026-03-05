interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav class="flex items-center gap-1 font-mono text-sm">
      {items.map((item, i) => (
        <>
          {i > 0 && <span class="text-sky-300">/</span>}
          {item.href ? (
            <a href={item.href} class="text-sky-500 hover:text-sky-700">
              {item.label}
            </a>
          ) : (
            <span class="text-sky-700">{item.label}</span>
          )}
        </>
      ))}
    </nav>
  );
}
