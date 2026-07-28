/**
 * Pre-renders every route to static HTML, and writes the sitemap.
 *
 * The SPA shipped `<div id="root"></div>` and built the page in the browser.
 * Google executes JavaScript, but as a deferred second pass — so the words were
 * not in the document a crawler first receives. This renders each route with
 * react-dom/server at build time and writes a real HTML file per URL, which the
 * client then hydrates.
 *
 * Effects do not run during renderToString, so the <head> tags that useSeo and
 * useJsonLd normally set are injected here instead, from src/lib/seo.js — the
 * same module the runtime hooks read, so the two cannot drift.
 *
 * Runs after both `vite build` and `vite build --ssr`. See package.json.
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const SSR_ENTRY = 'dist-ssr/entry-server.js';
const SITE = 'https://www.gyanaranjanpanda.com';

if (!existsSync(join(DIST, 'index.html'))) {
  throw new Error('dist/index.html missing — run `vite build` first.');
}
if (!existsSync(SSR_ENTRY)) {
  throw new Error(`${SSR_ENTRY} missing — run \`vite build --ssr\` first.`);
}

const { render, ALL_ROUTES, POST_INDEX, articleJsonLd } = await import(
  pathToFileURL(join(process.cwd(), SSR_ENTRY)).href
);

// Read the template once, before any of it gets overwritten below.
const TEMPLATE = readFileSync(join(DIST, 'index.html'), 'utf8');

const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Replace an attribute value without letting $-sequences in the value expand. */
const setAttr = (html, pattern, value) =>
  html.replace(pattern, (_m, open, close) => open + escAttr(value) + close);

const setMetaName = (h, name, v) =>
  setAttr(h, new RegExp(`(<meta name="${name}" content=")[^"]*(")`), v);

const setMetaProp = (h, prop, v) =>
  setAttr(h, new RegExp(`(<meta property="${prop}" content=")[^"]*(")`), v);

function buildPage(route) {
  const { html, seo } = render(route);
  const url = SITE + (route === '/' ? '/' : route);

  let page = TEMPLATE;

  page = page.replace(
    /<title>[\s\S]*?<\/title>/,
    () => `<title>${escAttr(seo.title)}</title>`,
  );
  page = setAttr(page, /(<link rel="canonical" href=")[^"]*(")/, url);
  page = setMetaProp(page, 'og:url', url);
  page = setMetaProp(page, 'og:type', seo.type);
  page = setMetaProp(page, 'og:title', seo.title);
  page = setMetaName(page, 'twitter:title', seo.title);

  if (seo.description) {
    page = setMetaName(page, 'description', seo.description);
    page = setMetaProp(page, 'og:description', seo.description);
    page = setMetaName(page, 'twitter:description', seo.description);
  }

  // Article schema, so it is present without executing JavaScript.
  if (seo.post) {
    const ld = JSON.stringify(articleJsonLd(seo.post), null, 2);
    page = page.replace(
      '</head>',
      `  <script type="application/ld+json" id="route-jsonld">\n${ld}\n    </script>\n  </head>`,
    );
  }

  page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  return page;
}

/* ---------- write one HTML file per route ---------- */

for (const route of ALL_ROUTES) {
  const out = route === '/' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buildPage(route));
}

/* ---------- sitemap, from the same route list ---------- */

const PRIORITY = { '/': '1.0', '/work': '0.9', '/projects': '0.9', '/blog': '0.9', '/contact': '0.6' };
const CHANGEFREQ = { '/': 'monthly', '/work': 'monthly', '/projects': 'monthly', '/blog': 'weekly', '/contact': 'yearly' };

const today = new Date().toISOString().slice(0, 10);
const dateFor = Object.fromEntries(POST_INDEX.map((p) => [`/blog/${p.slug}`, p.date]));
const newestPost = POST_INDEX.map((p) => p.date).sort().at(-1) ?? today;

const urls = ALL_ROUTES.map((route) => {
  const lastmod = dateFor[route] ?? (route === '/blog' ? newestPost : today);
  return [
    '  <url>',
    `    <loc>${SITE}${route === '/' ? '/' : route}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${CHANGEFREQ[route] ?? 'yearly'}</changefreq>`,
    `    <priority>${PRIORITY[route] ?? '0.8'}</priority>`,
    '  </url>',
  ].join('\n');
});

writeFileSync(
  join(DIST, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n',
);

rmSync('dist-ssr', { recursive: true, force: true });

const posts = POST_INDEX.length;
console.log(
  `prerendered ${ALL_ROUTES.length} routes (${ALL_ROUTES.length - posts} pages + ${posts} posts)`,
);
console.log(`sitemap.xml: ${ALL_ROUTES.length} URLs`);
