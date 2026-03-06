/**
 * official-registry: SEO エンドポイントの E2E テスト
 * 051-seo.md に対応
 */
import { test, expect } from "@playwright/test";

test.describe("SEO エンドポイント", () => {
  test("robots.txt が取得できる", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");
    expect(text).toContain("Sitemap:");
  });

  test("robots.txt に Sitemap: https://mir.tbsten.me/sitemap.xml を含む", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    const text = await res.text();
    expect(text).toContain("Sitemap: https://mir.tbsten.me/sitemap.xml");
  });

  test("sitemap.xml が取得できる", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("<?xml");
    expect(text).toContain("</urlset>");
  });

  test("sitemap.xml は valid XML", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    const text = await res.text();
    expect(text).toMatch(/^<\?xml version="1.0"/);
    expect(text).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    );
  });

  test("sitemap.xml に静的ページ URL を含む", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    const text = await res.text();
    expect(text).toContain("https://mir.tbsten.me/");
    expect(text).toContain("https://mir.tbsten.me/docs");
    expect(text).toContain("https://mir.tbsten.me/snippets");
  });

  test("sitemap.xml に snippet URL を含む", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    const text = await res.text();
    // provider に含まれている snippet の URL を確認
    expect(text).toContain("/snippets/react-hook");
    expect(text).toContain("/snippets/react-component");
  });

  test("OGP メタタグがトップページに含まれる", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page.locator('meta[property="og:title"]');
    const ogDescription = await page.locator(
      'meta[property="og:description"]',
    );
    const ogImage = await page.locator('meta[property="og:image"]');

    await expect(ogTitle).toBeTruthy();
    await expect(ogDescription).toBeTruthy();
    await expect(ogImage).toBeTruthy();
  });

  test("snippet ページに OGP メタタグが含まれる", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const ogTitle = await page.locator('meta[property="og:title"]');
    const ogDescription = await page.locator(
      'meta[property="og:description"]',
    );

    const titleContent = await ogTitle.getAttribute("content");
    const descriptionContent = await ogDescription.getAttribute("content");

    expect(titleContent).toContain("react-hook");
    expect(descriptionContent).toBeTruthy();
  });

  test("canonical URL がページに含まれる", async ({ page }) => {
    await page.goto("/");
    const canonical = await page.locator('link[rel="canonical"]');
    const href = await canonical.getAttribute("href");
    expect(href).toBe("https://mir.tbsten.me/");
  });

  test("snippet ページの canonical URL が正しい", async ({ page }) => {
    await page.goto("/snippets/react-hook");
    const canonical = await page.locator('link[rel="canonical"]');
    const href = await canonical.getAttribute("href");
    expect(href).toBe("https://mir.tbsten.me/snippets/react-hook");
  });

  test("Twitter Card メタタグが含まれる", async ({ page }) => {
    await page.goto("/");
    const twitterCard = await page.locator('meta[name="twitter:card"]');
    const content = await twitterCard.getAttribute("content");
    expect(content).toBe("summary_large_image");
  });
});
