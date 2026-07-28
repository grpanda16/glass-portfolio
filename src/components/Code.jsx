import { useMemo, useRef, useState } from 'react';
import { tokenize } from '../lib/highlight';

const LABEL = {
  java: 'Java', js: 'JavaScript', jsx: 'JSX', json: 'JSON',
  yaml: 'YAML', yml: 'YAML', properties: 'properties', xml: 'XML', html: 'HTML', sql: 'SQL',
  bash: 'shell', sh: 'shell', shell: 'shell', http: 'HTTP', text: 'text',
};

export default function Code({ lang = 'text', name, children }) {
  const src = String(children).replace(/\n+$/, '');
  const tokens = useMemo(() => tokenize(src, lang), [src, lang]);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(src);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (insecure context / denied) — leave the label alone */
    }
  };

  return (
    <div className="code">
      <div className="code-bar">
        <div className="code-dots" aria-hidden="true"><i /><i /><i /></div>
        <span className="code-name">{name || LABEL[lang] || lang}</span>
        <button className={`code-copy${copied ? ' done' : ''}`} onClick={copy} type="button">
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre><code>
        {tokens.map((t, i) => (t.c ? <span key={i} className={t.c}>{t.t}</span> : t.t))}
      </code></pre>
    </div>
  );
}
