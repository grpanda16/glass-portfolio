import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import AppShell from './AppShell';
import { ALL_ROUTES, articleJsonLd, seoFor } from './lib/seo';
import { POSTS } from './posts';

export { ALL_ROUTES, articleJsonLd, seoFor };

/** Slim post list for sitemap generation — same registry the app renders from. */
export const POST_INDEX = POSTS.map((p) => ({ slug: p.slug, date: p.date }));

/**
 * Renders one route to static HTML.
 *
 * Note: effects do not run during renderToString, so useSeo and useJsonLd are
 * inert here. The prerender script writes those tags into the template itself,
 * reading from the same lib/seo.js the runtime hooks use.
 */
export function render(url) {
  const html = renderToString(
    <StaticRouter location={url}>
      <AppShell />
    </StaticRouter>,
  );
  return { html, seo: seoFor(url) };
}
