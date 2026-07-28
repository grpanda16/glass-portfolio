import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-only stand-in for api/visits.js.
 *
 * `vite dev` and `vite preview` do not run Vercel's serverless functions, so
 * without this the counter is untestable outside a deployment. Counts in
 * memory and resets on restart — it exists to exercise the UI, not to be
 * accurate.
 */
function visitsDevApi() {
  let count = 1283;

  const handle = (req, res) => {
    if (req.method === 'POST') count += 1;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ count }));
  };

  return {
    name: 'visits-dev-api',
    apply: 'serve', // never included in a production build
    // Block bodies on purpose: these hooks treat a returned function as a
    // post-middleware hook, and `.use()` returns the callable connect app.
    configureServer(server) {
      server.middlewares.use('/api/visits', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/visits', handle);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), visitsDevApi()],
});
