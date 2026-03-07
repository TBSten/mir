import { Tag } from "./tag.js";

interface SnippetCardProps {
  name: string;
  version?: string;
  description?: string;
  tags?: string[];
  installs?: string;
  stars?: string;
}

export function SnippetCard({
  name,
  version,
  description,
  tags,
  installs,
  stars,
}: SnippetCardProps) {
  return (
    <>
      <a
        href={`/snippets/${encodeURIComponent(name)}`}
        class="flex flex-col gap-3 border border-sky-200 bg-white p-5 hover:border-sky-400"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="font-mono text-sm font-medium text-sky-900">{name}</p>
          {version && (
            <span class="font-mono text-xs text-sky-400">{version}</span>
          )}
        </div>
        {description && (
          <p class="font-body text-xs leading-relaxed text-sky-600">
            {`// ${description}`}
          </p>
        )}
        <div class="flex items-center gap-2">
          {tags?.map((tag) => <Tag>{tag}</Tag>)}
        </div>
        <div class="flex items-center gap-4 font-mono text-xs text-sky-400">
          <span id={`installs-${name}`}>{`↓ --`}</span>
          {stars && <span>{`* ${stars}`}</span>}
        </div>
      </a>
      <script>{`
(async () => {
  try {
    const res = await fetch('/api/stats/${name}');
    const data = await res.json();
    const el = document.getElementById('installs-${name}');
    if (el) {
      el.textContent = '↓ ' + data.count;
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('Failed to load stats:', error);
    console.error('Error details:', e);
  }
})();
`}</script>
    </>
  );
}
