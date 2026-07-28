import { useEffect, useMemo, useState } from 'react';
import { tokenize } from '../lib/highlight';
import { HERO_SNIPPETS } from '../data';

const TYPE_MS = 18;   // per character while writing
const ERASE_MS = 7;   // faster on the way out, like a held backspace
const HOLD_MS = 2200; // time to actually read the finished snippet
const GAP_MS = 320;   // beat between cards

/**
 * Types each snippet out, holds it, erases it, moves to the next, loops.
 *
 * Highlighting runs on the partial string, so tokens resolve as they complete —
 * an unterminated string simply stays unstyled until its closing quote arrives,
 * which reads naturally rather than flickering.
 *
 * Under prefers-reduced-motion nothing animates: the selected snippet renders
 * whole, and the language tabs still switch it.
 */
export default function CodeTyper() {
  const [index, setIndex] = useState(0);
  const [len, setLen] = useState(0);
  const [phase, setPhase] = useState('typing'); // typing | holding | erasing
  const [reduced, setReduced] = useState(false);

  const snippet = HERO_SNIPPETS[index];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    const full = snippet.code;
    let timer;

    if (phase === 'typing') {
      if (len < full.length) {
        timer = setTimeout(() => setLen((l) => l + 1), TYPE_MS);
      } else {
        setPhase('holding');
      }
    } else if (phase === 'holding') {
      timer = setTimeout(() => setPhase('erasing'), HOLD_MS);
    } else if (len > 0) {
      timer = setTimeout(() => setLen((l) => l - 1), ERASE_MS);
    } else {
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_SNIPPETS.length);
        setPhase('typing');
      }, GAP_MS);
    }

    return () => clearTimeout(timer);
  }, [phase, len, snippet.code, reduced]);

  /** Jump straight to a language when a tab is clicked. */
  const select = (i) => {
    if (i === index) return;
    setIndex(i);
    setLen(reduced ? HERO_SNIPPETS[i].code.length : 0);
    setPhase('typing');
  };

  const shown = reduced ? snippet.code : snippet.code.slice(0, len);
  const tokens = useMemo(() => tokenize(shown, snippet.lang), [shown, snippet.lang]);

  return (
    <div className="code code-typer">
      <div className="code-bar">
        <div className="code-dots" aria-hidden="true"><i /><i /><i /></div>
        <span className="code-name">{snippet.file}</span>
      </div>

      {/*
        aria-live would announce every keystroke, so the animation is hidden
        from assistive tech and the complete snippet is exposed once instead.
      */}
      <pre aria-hidden="true"><code>
        {tokens.map((t, i) => (t.c ? <span key={i} className={t.c}>{t.t}</span> : t.t))}
        <span className={`typer-cursor${phase === 'holding' || reduced ? ' blink' : ''}`} />
      </code></pre>
      <span className="sr-only">{snippet.label} example: {snippet.code}</span>

      <div className="typer-tabs" role="group" aria-label="Language">
        {HERO_SNIPPETS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className={`typer-tab${i === index ? ' on' : ''}`}
            aria-current={i === index}
            onClick={() => select(i)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
