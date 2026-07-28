import { useEffect } from 'react';
import { SITE } from './seo';

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Per-route <title>, description, canonical and OG tags.
 *
 * Production HTML already carries the correct tags from the prerenderer; this
 * keeps them right across client-side navigations, where no new document is
 * fetched.
 */
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
