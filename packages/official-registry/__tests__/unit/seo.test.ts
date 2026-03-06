/**
 * official-registry: SEO 機能のユニットテスト
 * 051-seo.md に対応
 */
import { describe, it, expect } from "vitest";
import { buildMetaTags, buildSitemap, buildRobotsTxt } from "../../app/lib/seo.js";
import { staticProvider } from "../../app/lib/provider.js";
import { SITE_NAME, SITE_DESCRIPTION } from "../../app/lib/constants.js";

describe("SEO メタタグ", () => {
  it("トップページのメタタグを生成できる", () => {
    const meta = buildMetaTags({
      title: undefined,
      description: SITE_DESCRIPTION,
      path: "/",
      image: "https://mir.tbsten.me/og-image.png",
    });

    expect(meta.title).toBe(SITE_NAME);
    expect(meta.ogTitle).toBe(SITE_NAME);
    expect(meta.ogDescription).toBe(SITE_DESCRIPTION);
    expect(meta.ogImage).toBe("https://mir.tbsten.me/og-image.png");
    expect(meta.canonicalUrl).toBe("https://mir.tbsten.me/");
  });

  it("snippet ページのメタタグを生成できる", () => {
    const meta = buildMetaTags({
      title: "react-hook",
      description: "A set of useful React hooks for common tasks",
      path: "/snippets/react-hook",
      image: "https://mir.tbsten.me/og-image.png",
    });

    expect(meta.title).toContain("react-hook");
    expect(meta.ogTitle).toContain("react-hook");
    expect(meta.ogDescription).toBe(
      "A set of useful React hooks for common tasks",
    );
    expect(meta.canonicalUrl).toBe("https://mir.tbsten.me/snippets/react-hook");
  });

  it("Twitter Card タグを含む", () => {
    const meta = buildMetaTags({
      title: "test",
      description: "test description",
      path: "/test",
      image: "https://mir.tbsten.me/og-image.png",
    });

    expect(meta.twitterCard).toBe("summary_large_image");
  });

  it("OGP タグは HTTPS URL を使用する", () => {
    const meta = buildMetaTags({
      title: "test",
      description: "test",
      path: "/test",
      image: "https://mir.tbsten.me/og-image.png",
    });

    expect(meta.canonicalUrl).toMatch(/^https:\/\//);
    expect(meta.ogImage).toMatch(/^https:\/\//);
  });
});

describe("Sitemap", () => {
  it("サイトマップを生成できる", async () => {
    const sitemap = await buildSitemap(staticProvider);
    expect(sitemap).toContain("<?xml");
    expect(sitemap).toContain("</urlset>");
  });

  it("サイトマップに静的ページを含む", async () => {
    const sitemap = await buildSitemap(staticProvider);
    expect(sitemap).toContain("<loc>https://mir.tbsten.me/</loc>");
    expect(sitemap).toContain("<loc>https://mir.tbsten.me/docs</loc>");
    expect(sitemap).toContain("<loc>https://mir.tbsten.me/snippets</loc>");
  });

  it("サイトマップに snippet ページを含む", async () => {
    const sitemap = await buildSitemap(staticProvider);
    // provider に含まれている snippet を確認
    const snippets = await staticProvider.list();
    for (const snippet of snippets) {
      expect(sitemap).toContain(`/snippets/${snippet.name}`);
    }
  });

  it("サイトマップの XML は valid", async () => {
    const sitemap = await buildSitemap(staticProvider);
    // 基本的な XML 構造をチェック
    expect(sitemap).toMatch(
      /<\?xml version="1.0" encoding="UTF-8"\?>/i,
    );
    expect(sitemap).toMatch(
      /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
    );
  });
});

describe("robots.txt", () => {
  it("robots.txt を生成できる", () => {
    const robots = buildRobotsTxt();
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap:");
  });

  it("robots.txt に正しい Sitemap URL を含む", () => {
    const robots = buildRobotsTxt();
    expect(robots).toContain("Sitemap: https://mir.tbsten.me/sitemap.xml");
  });
});
