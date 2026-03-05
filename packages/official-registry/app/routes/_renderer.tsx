import { Style } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { Header } from "../components/header.js";
import { Footer } from "../components/footer.js";
import { SITE_NAME } from "../lib/constants.js";

export default jsxRenderer(({ children, title }) => {
  const pageTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
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
      <body class="bg-sky-50 font-body text-sky-900 antialiased">
        <Header />
        <main class="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
});
