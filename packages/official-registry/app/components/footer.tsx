import { GITHUB_URL, SITE_NAME } from "../lib/constants.js";

export function Footer() {
  return (
    <footer class="border-t border-sky-200 px-10 py-6">
      <div class="flex items-center justify-between">
        <p class="font-mono text-xs text-sky-500">
          {`// ${SITE_NAME} — open source cli tool`}
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-xs text-sky-500 hover:text-sky-700"
        >
          github
        </a>
      </div>
    </footer>
  );
}
