import { useEffect } from 'react';

// Must match the host that actually serves the site — a canonical pointing at a
// domain that does not resolve breaks indexing and social previews.
const SITE = 'https://www.gyanaranjanpanda.com';

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) return;
  el.setAttribute(attr, value);
}

/** Per-route <title>, description, canonical and OG tags. */
export default function useSeo({ title, description, path, type = 'website' }) {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMeta('meta[property="og:title"]', 'content', title);
      setMeta('meta[name="twitter:title"]', 'content', title);
    }
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }
    if (path) {
      const url = SITE + path;
      setMeta('link[rel="canonical"]', 'href', url);
      setMeta('meta[property="og:url"]', 'content', url);
    }
    setMeta('meta[property="og:type"]', 'content', type);
  }, [title, description, path, type]);
}
