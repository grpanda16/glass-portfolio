import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const root = document.getElementById('root');
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production HTML is prerendered (see scripts/prerender.mjs), so attach to the
// existing markup. In dev the root is empty, so render from scratch.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
