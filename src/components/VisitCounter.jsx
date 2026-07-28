import { useEffect, useState } from 'react';

const SESSION_KEY = 'visit-counted';

/**
 * Total visits, rendered in the footer.
 *
 * Counts once per browser session: the first load POSTs (incrementing), later
 * navigations GET. Without that, every client-side route change would count as
 * a visit, and StrictMode's double-invoked effects would count twice in dev.
 *
 * Renders nothing until a number arrives, and nothing at all if the endpoint is
 * unconfigured or down — a visit counter is not worth an error message on a
 * portfolio.
 */
export default function VisitCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const ac = new AbortController();

    let counted = false;
    try {
      counted = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // private mode / storage disabled — fall through and just read
      counted = true;
    }

    fetch('/api/visits', { method: counted ? 'GET' : 'POST', signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (typeof data.count !== 'number') return;
        setCount(data.count);
        if (!counted) {
          try {
            sessionStorage.setItem(SESSION_KEY, '1');
          } catch { /* nothing to do */ }
        }
      })
      .catch(() => { /* stay hidden */ });

    return () => ac.abort();
  }, []);

  if (count === null) return null;

  return (
    <span className="visits" title="Total visits to this site">
      <span className="visits-dot" aria-hidden="true" />
      {count.toLocaleString()} {count === 1 ? 'visit' : 'visits'}
    </span>
  );
}
