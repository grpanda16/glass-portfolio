/**
 * Post registry.
 *
 * Every `src/posts/*.jsx` file exports `meta` plus a default component. Vite's
 * import.meta.glob picks them up at build time, so adding a post is one file —
 * no registration list to keep in sync.
 */
const modules = import.meta.glob('./*.jsx', { eager: true });

export const POSTS = Object.entries(modules)
  .map(([path, mod]) => ({
    slug: path.slice(2, -4), // './name.jsx' -> 'name'
    Body: mod.default,
    ...mod.meta,
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug) => POSTS.find((p) => p.slug === slug);

export const ALL_TAGS = [...new Set(POSTS.flatMap((p) => p.tags))].sort();

export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
