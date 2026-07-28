/**
 * Visit counter.
 *
 *   POST /api/visits  -> increment, return the new total
 *   GET  /api/visits  -> read the total without incrementing
 *
 * Backed by Vercel KV (Upstash Redis). Talks to the REST API with plain fetch
 * rather than pulling in a client library — one endpoint, two commands, no
 * dependency worth adding.
 *
 * INCR is atomic, so concurrent visitors cannot read-modify-write over each
 * other the way a SELECT-then-UPDATE would.
 *
 * Set up: Vercel dashboard -> Storage -> Create KV, and connect it to this
 * project. KV_REST_API_URL and KV_REST_API_TOKEN are injected automatically.
 * Until then this returns 503 and the UI simply renders nothing.
 */

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = 'site:visits';

/** Crawlers should not inflate the number. */
const BOT = /bot|crawl|spider|slurp|bing|duckduck|baidu|yandex|facebookexternalhit|preview|lighthouse|headless/i;

async function kv(command) {
  const res = await fetch(`${KV_URL}/${command}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`kv responded ${res.status}`);
  const body = await res.json();
  return body.result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ error: 'counter not configured' });
  }

  const isBot = BOT.test(req.headers['user-agent'] || '');
  const shouldCount = req.method === 'POST' && !isBot;

  try {
    const result = await kv(shouldCount ? `incr/${KEY}` : `get/${KEY}`);
    return res.status(200).json({ count: Number(result) || 0 });
  } catch {
    // Never let a counter outage surface as a broken page.
    return res.status(502).json({ error: 'counter unavailable' });
  }
}
