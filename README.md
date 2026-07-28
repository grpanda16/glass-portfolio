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

## Notes

- The GitHub repository grid on `/work` calls the public GitHub API
  unauthenticated — 60 requests/hour per IP. It degrades to a link on failure.
- The contact form has no backend. It validates, then opens the visitor's mail
  client with the message prefilled. Nothing is sent or stored server-side.
- `public/hero.jpg` and `public/hero.webp` are no longer referenced — the hero
  uses a code panel instead. Delete them if you do not want them back.
