/**
 * Writes dist/sitemap.xml after the Vite build.
 *
 * Generated rather than checked in, because posts are added by dropping a file
 * into src/posts — a hand-maintained sitemap would silently go stale the first
 * time that happens.
 *
 * Post metadata lives in `export const meta = {...}` inside each .jsx file.
 * Only slug and date are needed here, so this reads them directly instead of
 * bundling JSX to run it in Node. That couples this script to the shape of the
 * meta block: if you rename `date`, update the regex below.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://www.gyanaranjanpanda.com';
const POSTS_DIR = 'src/posts';
const OUT_DIR = 'dist';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/work', changefreq: 'monthly', priority: '0.9' },
  { path: '/writing', changefreq: 'weekly', priority: '0.9' },
  { path: '/contact', changefreq: 'yearly', priority: '0.6' },
];

function readPosts() {
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.jsx'))
    .map((file) => {
      const src = readFileSync(join(POSTS_DIR, file), 'utf8');
      const date = src.match(/date:\s*['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];

      // Fail the build rather than publish a sitemap with wrong dates.
      if (!date) {
        throw new Error(
          `${file}: could not find meta.date (expected date: 'YYYY-MM-DD'). ` +
            `Sitemap generation aborted.`,
        );
      }
      return { slug: file.replace(/\.jsx$/, ''), date };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

if (!existsSync(OUT_DIR)) {
  throw new Error(`${OUT_DIR}/ not found — run vite build first.`);
}

const posts = readPosts();
const today = new Date().toISOString().slice(0, 10);
const newestPost = posts[0]?.date ?? today;

const entries = [
  ...STATIC_ROUTES.map((r) =>
    urlEntry({
      loc: SITE + r.path,
      // /writing changes whenever a post lands; the rest track the build
      lastmod: r.path === '/writing' ? newestPost : today,
      changefreq: r.changefreq,
      priority: r.priority,
    }),
  ),
  ...posts.map((p) =>
    urlEntry({
      loc: `${SITE}/writing/${p.slug}`,
      lastmod: p.date,
      changefreq: 'yearly',
      priority: '0.8',
    }),
  ),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.join('\n') +
  '\n</urlset>\n';

writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml);
console.log(
  `sitemap.xml: ${STATIC_ROUTES.length} pages + ${posts.length} posts = ${entries.length} URLs`,
);
