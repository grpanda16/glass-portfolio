import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router keeps scroll position across navigations. Reset it on every
 * pathname change, or jump to #hash when one is present.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
