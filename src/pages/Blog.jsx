import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import useSeo from '../lib/useSeo';
import { PAGE_SEO } from '../lib/seo';
import { ALL_TAGS, POSTS, formatDate } from '../posts';

export default function Blog() {
  const [tag, setTag] = useState(null);

  const shown = useMemo(
    () => (tag ? POSTS.filter((p) => p.tags.includes(tag)) : POSTS),
    [tag],
  );

  useSeo({ ...PAGE_SEO['/blog'], path: '/blog' });

  return (
    <div className="wrap page">
      <Reveal className="page-head">
        <span className="pill">
          <span className="dot" />{POSTS.length} posts · {ALL_TAGS.length} topics
        </span>
        <h1 className="h-lg" style={{ margin: '20px 0 16px' }}>
          Backend notes, written <span className="gradtext">after the fix.</span>
        </h1>
        <p className="lede">
          Auth, event delivery, query performance, and how to lay a service out so the next person
          can change it safely. Mostly things that bit me in production first — written the way
          I&apos;d explain them to whoever inherits the code, not the way a tutorial would.
        </p>
      </Reveal>

      <Reveal className="topics">
        <button
          type="button"
          className={`topic${tag === null ? ' on' : ''}`}
          onClick={() => setTag(null)}
          aria-pressed={tag === null}
        >
          All
        </button>
        {ALL_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            className={`topic${tag === t ? ' on' : ''}`}
            onClick={() => setTag(tag === t ? null : t)}
            aria-pressed={tag === t}
          >
            {t}
          </button>
        ))}
      </Reveal>

      <div className="postlist">
        {shown.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 6) * 70}>
            <Link className="card post-row" to={`/blog/${p.slug}`}>
              <span className="post-idx">{String(i + 1).padStart(2, '0')}</span>
              <div className="post-main">
                <h3>{p.title}</h3>
                <p>{p.blurb}</p>
                <div className="post-tags">
                  {p.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
                </div>
              </div>
              <div className="post-date">
                <span>{formatDate(p.date)}</span>
                <span>{p.read}</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {shown.length === 0 && <p className="state">Nothing tagged “{tag}” yet.</p>}
    </div>
  );
}
