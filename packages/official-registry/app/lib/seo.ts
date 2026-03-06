/**
 * SEO ユーティリティ
 * OGP meta タグ、Sitemap、robots.txt の生成
 */
import type { RegistryProvider } from "@mir/registry-sdk";
import { SITE_NAME } from "./constants.js";

export interface MetaTags {
  title: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  twitterCard: string;
}

interface BuildMetaTagsInput {
  title?: string;
  description: string;
  path: string;
  image: string;
}

const SITE_DOMAIN = "https://mir.tbsten.me";

/**
 * ページ用のメタタグを生成
 */
export function buildMetaTags(input: BuildMetaTagsInput): MetaTags {
  const { title, description, path, image } = input;
  const pageTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = `${SITE_DOMAIN}${path}`;

  return {
    title: pageTitle,
    ogTitle: pageTitle,
    ogDescription: description,
    ogImage: image,
    canonicalUrl,
    twitterCard: "summary_large_image",
  };
}

/**
 * sitemap.xml を生成
 */
export async function buildSitemap(provider: RegistryProvider): Promise<string> {
  const staticPages = [
    "/",
    "/docs",
    "/snippets",
  ];

  const snippets = await provider.list();
  const snippetPages = snippets.map((s) => `/snippets/${s.name}`);

  const allPages = [...staticPages, ...snippetPages];

  const urls = allPages
    .map((page) => {
      return `  <url>
    <loc>${SITE_DOMAIN}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === "/" ? "1.0" : "0.8"}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * robots.txt を生成
 */
export function buildRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_DOMAIN}/sitemap.xml`;
}
