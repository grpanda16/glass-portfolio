import { Link, useParams } from 'react-router-dom';
import useSeo from '../lib/useSeo';
import NotFound from './NotFound';
import { LINKS } from '../data';
import { POSTS, formatDate, getPost } from '../posts';

export default function Post() {
  const { slug } = useParams();
  const post = getPost(slug);

  // hooks must run unconditionally — feed the SEO hook a safe fallback
  useSeo({
    title: post ? `${post.title} — Gyanaranjan Panda` : 'Not found — Gyanaranjan Panda',
    description: post ? post.blurb : undefined,
    path: `/writing/${slug}`,
    type: 'article',
  });

  if (!post) return <NotFound what="post" />;

  const i = POSTS.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? POSTS[i - 1] : null;
  const older = i < POSTS.length - 1 ? POSTS[i + 1] : null;

  const { Body } = post;

  return (
    <div className="wrap page">
      <article className="article">
        <header className="article-head">
          <Link className="post-idx" to="/writing" style={{ display: 'inline-block' }}>
            ← All writing
          </Link>

          <h1>{post.title}</h1>

          <div className="article-kicker">
            <span>{formatDate(post.date)}</span>
            <span className="sep" aria-hidden="true" />
            <span>{post.read} read</span>
            <span className="sep" aria-hidden="true" />
            <div className="chips">
              {post.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
            </div>
          </div>
        </header>

        {/* article body renders immediately — never gate prose behind an animation */}
        <div className="prose">
          <Body />
        </div>

        <footer className="article-foot">
          {(newer || older) && (
            <nav className="postnav" aria-label="More posts">
              {older ? (
                <Link className="card hoverable" to={`/writing/${older.slug}`}>
                  <div className="dir">← Older</div>
                  <div className="ttl">{older.title}</div>
                </Link>
              ) : <span />}

              {newer ? (
                <Link className="card hoverable nxt" to={`/writing/${newer.slug}`}>
                  <div className="dir">Newer →</div>
                  <div className="ttl">{newer.title}</div>
                </Link>
              ) : <span />}
            </nav>
          )}

          <div className="card cta-band" style={{ padding: 'clamp(28px,4vw,40px)' }}>
            <h2 className="h-md">Found this useful?</h2>
            <p className="lede" style={{ margin: '12px auto 0', fontSize: 15 }}>
              I write about the backend problems that only show up under real load.
            </p>
            <div className="cta">
              <Link className="btn solid" to="/writing">More writing</Link>
              <a className="btn" href={LINKS.linkedin} target="_blank" rel="noreferrer">
                Follow on LinkedIn ↗
              </a>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
