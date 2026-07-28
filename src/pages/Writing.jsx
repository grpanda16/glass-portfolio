import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import useSeo from '../lib/useSeo';
import { ALL_TAGS, POSTS, formatDate } from '../posts';

export default function Writing() {
  const [tag, setTag] = useState(null);

  const shown = useMemo(
    () => (tag ? POSTS.filter((p) => p.tags.includes(tag)) : POSTS),
    [tag],
  );

  useSeo({
    title: 'Writing — Gyanaranjan Panda',
    description:
      'Notes on JWT and Spring Security, Keycloak and OAuth 2.0, idempotent Kafka consumers, ' +
      'JPA performance and structuring Spring Boot microservices.',
    path: '/writing',
  });

  return (
    <div className="wrap page">
      <Reveal className="page-head">
        <span className="pill"><span className="dot" />{POSTS.length} posts</span>
        <h1 className="h-lg" style={{ margin: '20px 0 16px' }}>
          Notes from the <span className="gradtext">backend.</span>
        </h1>
        <p className="lede">
          Things I got wrong first, then understood properly — auth, event delivery, and the
          queries that only fall over once there is real data behind them. Written the way I would
          explain it to the engineer who has to maintain it.
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
            <Link className="card post-row" to={`/writing/${p.slug}`}>
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
