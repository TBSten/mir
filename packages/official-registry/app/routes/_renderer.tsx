import { Style } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { Header } from "../components/header.js";
import { Footer } from "../components/footer.js";
import { SITE_NAME, SITE_DESCRIPTION } from "../lib/constants.js";
import { buildMetaTags } from "../lib/seo.js";

const darkModeScript = `(function() { const t = localStorage.getItem('theme') || 'light'; if (t === 'dark') document.documentElement.classList.add('dark'); })();`;

const OG_IMAGE_URL = "https://mir.tbsten.me/og-image.png";

interface RendererContext {
  children: any;
  title?: string;
  description?: string;
  path?: string;
}

export default jsxRenderer((context) => {
  const { children, title, description = SITE_DESCRIPTION, path = "/" } = context as RendererContext;
  const pageTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;

  const metaTags = buildMetaTags({
    title,
    description,
    path,
    image: OG_IMAGE_URL,
  });

  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>

        {/* OGP */}
        <meta property="og:title" content={metaTags.ogTitle} />
        <meta property="og:description" content={metaTags.ogDescription} />
        <meta property="og:image" content={metaTags.ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ja_JP" />

        {/* Twitter Card */}
        <meta name="twitter:card" content={metaTags.twitterCard} />
        <meta name="twitter:title" content={metaTags.ogTitle} />
        <meta name="twitter:description" content={metaTags.ogDescription} />
        <meta name="twitter:image" content={metaTags.ogImage} />

        {/* Canonical URL */}
        <link rel="canonical" href={metaTags.canonicalUrl} />

        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {import.meta.env.PROD ? (
          <link href="/static/styles.css" rel="stylesheet" />
        ) : (
          <link href="/app/styles.css" rel="stylesheet" />
        )}
        <Style />
      </head>
      <body class="bg-sky-50 font-body text-sky-900 dark:bg-gray-900 dark:text-gray-50 antialiased">
        <Header />
        <main class="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
});
