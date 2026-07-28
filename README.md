# gyanaranjanpanda.com

Personal site for Gyanaranjan Panda — Java Full Stack Engineer.
React 19 + Vite, React Router, no UI framework. Deployed on Vercel.

## Run locally

```
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run lint     # oxlint
```

## Routes

| Path              | Page                                              |
| ----------------- | ------------------------------------------------- |
| `/`               | Hero, what I do, selected work, stack, latest posts |
| `/work`           | Experience timeline, projects, stack, live GitHub repos |
| `/writing`        | Blog index with tag filtering                     |
| `/writing/:slug`  | Article                                           |
| `/contact`        | Contact form + channels                           |
| anything else     | 404                                               |

`vercel.json` rewrites everything to `/` so deep links survive a refresh.

## Editing content

Almost everything lives in **`src/data.js`** — profile, metrics, experience,
projects, stack and links. Change it there, not in the components.

The one thing worth adding: **numbers**. The experience and project bullets are
accurate but qualitative. Wherever you can say *how much* — requests/day, latency
before and after, number of services, team size — put it in. That is the
difference between a good portfolio and a convincing one.

## Adding a blog post

Create one file in `src/posts/`. It is picked up automatically — there is no
registry to update, `import.meta.glob` handles it, and the filename becomes the
URL slug.

```jsx
// src/posts/my-post.jsx  ->  /writing/my-post
import Code from '../components/Code';

export const meta = {
  title: 'Post title',
  date: '2026-07-20',        // ISO; controls ordering
  read: '7 min',
  tags: ['Kafka', 'Spring Boot'],
  blurb: 'One or two sentences shown on the index and in link previews.',
};

export default function Post() {
  return (
    <>
      <p>Body copy. Plain HTML — <code>.prose</code> styles it.</p>
      <h2>A section</h2>
      <Code lang="java" name="Example.java">{`record Money(BigDecimal amount) {}`}</Code>
    </>
  );
}
```

### Available in posts

- `<Code lang="…" name="…">` — `java`, `js`, `json`, `yaml`, `xml`, `bash`,
  `http`, `properties`. Anything else renders unhighlighted. Highlighting is a
  small single-pass tokenizer in `src/lib/highlight.js`; tokens render as React
  text nodes, never as raw HTML.
- `<div className="note">` — callout. Add `good` or `bad` for the mint/red
  variants. Put the label in `<span className="nt">`.
- `<div className="table-scroll"><table>…` — tables that scroll on mobile
  instead of breaking the layout.

## Design system

All of it is in `src/index.css`, organised by section and driven by custom
properties at the top — colours, type, radii, easing. Change `--mint` / `--iris`
and the whole site follows, including the favicon gradient (`public/favicon.svg`)
if you update it to match.

Dark only, by choice. Motion respects `prefers-reduced-motion` throughout.

## Social card

`public/og.png` (1200×630) is referenced by the OG and Twitter meta tags in
`index.html`. It was generated from an SVG; regenerate it if the tagline changes.

## SEO & pre-rendering

`npm run build` runs three stages:

```
vite build                                  # client bundle
vite build --ssr src/entry-server.jsx       # server bundle (temp)
node scripts/prerender.mjs                  # static HTML + sitemap
```

The prerenderer renders every route with `react-dom/server` and writes a real
HTML file per URL — `dist/work/index.html`, `dist/writing/<slug>/index.html` and
so on — so crawlers receive the actual text instead of an empty `<div id="root">`.
The browser then hydrates it (`src/main.jsx` picks `hydrateRoot` when the root
already has markup, `createRoot` in dev when it doesn't). The temporary
`dist-ssr/` is deleted afterwards.

**Adding a post needs no extra step.** It is picked up by the glob, prerendered,
and added to the sitemap automatically.

### Where the metadata lives

`src/lib/seo.js` is the single source: titles, descriptions, the route list and
the `BlogPosting` schema. Both the build-time prerenderer and the runtime hooks
(`useSeo`, `useJsonLd`) read it, so the static HTML and client-side navigation
can't disagree. Effects don't run during `renderToString`, which is why the
prerenderer writes the `<head>` tags itself rather than relying on the hooks.

- **`public/robots.txt`** — static, allows everything, points at the sitemap.
- **`dist/sitemap.xml`** — generated, with real `lastmod` dates from each post.
- **Person schema** — static JSON-LD in `index.html`. This is what connects a
  search for the name to this site; keep `sameAs` pointing at LinkedIn and GitHub.
- **BlogPosting schema** — in the prerendered HTML for articles, and managed on
  client-side navigation by `src/lib/useJsonLd.js` (added on entry, removed on
  exit, so non-article routes stay clean).

> `robots.txt` and `sitemap.xml` must be real files. `vercel.json` rewrites every
> unmatched path to `/`, so anything missing returns the SPA's HTML with a 200
> instead of a 404 — which is how a missing sitemap silently becomes an
> "existing" one full of HTML. Vercel checks the filesystem before rewrites, so
> the prerendered pages win and the rewrite only catches genuinely unknown URLs.

### SSR constraints

Components must not touch `window`, `document` or `navigator` during render —
only inside effects or event handlers. Break that and the build fails at the
prerender step rather than in production.

## Notes

- The GitHub repository grid on `/work` calls the public GitHub API
  unauthenticated — 60 requests/hour per IP. It degrades to a link on failure.
- The contact form has no backend. It validates, then opens the visitor's mail
  client with the message prefilled. Nothing is sent or stored server-side.
- The hero panel (`src/components/CodeTyper.jsx`) types each snippet in
  `HERO_SNIPPETS`, holds it, erases it and moves to the next, looping. The
  language tabs jump straight to one. Edit the snippets in `src/data.js` —
  **keep them within 17 lines and ~57 columns**: the panel height is pinned to
  the tallest so the hero never reflows mid-cycle, and longer lines force a
  horizontal scrollbar that looks broken while typing. Under
  `prefers-reduced-motion` nothing animates and the snippet renders whole.
- There are no images on the site apart from the favicon and the social card.
  The hero is rendered type, so nothing to keep in sync and nothing to optimise.
