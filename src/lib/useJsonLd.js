import { useEffect } from 'react';

const TAG_ID = 'route-jsonld';

/**
 * Injects per-route schema.org JSON-LD into <head>.
 *
 * The site-wide Person schema is static in index.html so it is present without
 * JavaScript; this handles the route-specific graph (articles) on top.
 *
 * Serialised for the dependency array so a fresh object literal from the caller
 * does not re-run the effect on every render.
 */
export default function useJsonLd(data) {
  const json = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!json) return;

    let el = document.getElementById(TAG_ID);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = TAG_ID;
      document.head.appendChild(el);
    }
    el.textContent = json;

    return () => el.remove();
  }, [json]);
}
