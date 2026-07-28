import { Link } from 'react-router-dom';
import CodeTyper from '../components/CodeTyper';
import OpenToWork from '../components/OpenToWork';
import Reveal from '../components/Reveal';
import useSeo from '../lib/useSeo';
import { PAGE_SEO } from '../lib/seo';
import { LINKS, METRICS, PROFILE, PROJECTS, STACK } from '../data';
import { POSTS, formatDate } from '../posts';

const DOING = [
  {
    t: 'Backend & APIs',
    d: 'Spring Boot services with a strict layered contract — validation at the edge, business rules in the domain, and exceptions handled once instead of everywhere.',
    tags: ['Spring Boot', 'REST', 'Spring Security'],
  },
  {
    t: 'Event-driven systems',
    d: 'Kafka pipelines where consumers are idempotent by design, because at-least-once delivery means duplicates are the contract, not an edge case.',
    tags: ['Kafka', 'Pub/Sub', 'Microservices'],
  },
  {
    t: 'Data & performance',
    d: 'JPA and SQL tuned deliberately — projections over entity hydration, batch fetching over N+1, and query counts asserted in tests.',
    tags: ['PostgreSQL', 'Hibernate', 'MongoDB'],
  },
  {
    t: 'Cloud & delivery',
    d: 'Services shipped to AWS and GCP through Docker-based CI/CD — managed queues, container deploys, and infrastructure a service can actually be handed to.',
    tags: ['AWS', 'GCP', 'Docker', 'CI/CD'],
  },
];

export default function Home() {
  const recent = POSTS.slice(0, 3);

  useSeo({ ...PAGE_SEO['/'], path: '/' });

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="wrap hero-grid">
          <Reveal>
            <span className="pill"><span className="dot" />{PROFILE.title} · {PROFILE.company}</span>

            {/* the name is the h1: it is the term the site should rank for */}
            <h1 className="hero-name">{PROFILE.name}</h1>

            <p className="hero-tagline">
              {PROFILE.tagline} <span className="accent">{PROFILE.taglineAccent}</span>
            </p>

            <p className="lede">{PROFILE.summary}</p>

            <div className="cta">
              <Link className="btn solid" to="/work">View work</Link>
              <Link className="btn" to="/blog">Read the blog</Link>
              <a className="btn" href={LINKS.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
            </div>

            <div className="hero-meta">
              <span>Now · <b>{PROFILE.company}</b></span>
              <span>Base · <b>{PROFILE.location}</b></span>
              <span>Exp · <b>{PROFILE.years} years</b></span>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <CodeTyper />
          </Reveal>
        </div>

        <div className="wrap">
          <Reveal className="metrics" delay={180}>
            {METRICS.map((m) => (
              <div key={m.v}>
                <div className="k">{m.k}</div>
                <div className="v">{m.v}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <div className="wrap stack-lg" style={{ paddingBottom: 'clamp(20px,4vw,40px)' }}>
        {/* ---------- what I do ---------- */}
        <section id="what">
          <Reveal>
            <div className="eyebrow"><span className="n">01</span> What I do</div>
            <h2 className="h-lg" style={{ maxWidth: '18ch', marginBottom: 34 }}>
              Systems that stay readable <span className="gradtext">long after release day.</span>
            </h2>
          </Reveal>

          <div className="stackgrid">
            {DOING.map((d, i) => (
              <Reveal key={d.t} delay={i * 90}>
                <article className="card hoverable stack-cell" style={{ height: '100%' }}>
                  <div className="lbl"><i />{d.t}</div>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 300, lineHeight: 1.65 }}>
                    {d.d}
                  </p>
                  <div className="chips" style={{ marginTop: 16 }}>
                    {d.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- selected work ---------- */}
        <section id="selected">
          <Reveal>
            <div className="eyebrow"><span className="n">02</span> Selected work</div>
          </Reveal>

          <div className="projects">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.name} delay={i * 100}>
                <article className="card hoverable proj">
                  <div className="proj-top">
                    <div className="proj-name">{p.name}</div>
                    <div className="proj-sub">{p.sub}</div>
                    <p className="lede" style={{ fontSize: 14.5, marginTop: 14 }}>{p.summary}</p>
                  </div>
                  <div className="proj-foot">
                    <div className="chips">
                      {p.tags.slice(0, 6).map((t) => <span className="chip" key={t}>{t}</span>)}
                      {p.tags.length > 6 && <span className="chip">+{p.tags.length - 6}</span>}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} style={{ marginTop: 22 }}>
            <Link className="btn" to="/projects">All projects →</Link>
          </Reveal>
        </section>

        {/* ---------- stack ---------- */}
        <section id="stack">
          <Reveal>
            <div className="eyebrow"><span className="n">03</span> Stack</div>
          </Reveal>
          <div className="stackgrid">
            {STACK.slice(0, 6).map(([group, items], i) => (
              <Reveal key={group} delay={i * 70}>
                <div className="card hoverable stack-cell" style={{ height: '100%' }}>
                  <div className="lbl"><i />{group}</div>
                  <div className="chips">
                    {items.map((it) => <span className="chip" key={it}>{it}</span>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- blog ---------- */}
        <section id="blog">
          <Reveal>
            <div className="eyebrow"><span className="n">04</span> From the blog</div>
          </Reveal>

          <div className="postlist">
            {recent.map((p, i) => (
              <Reveal key={p.slug} delay={i * 80}>
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

          <Reveal delay={120} style={{ marginTop: 22 }}>
            <Link className="btn" to="/blog">All posts →</Link>
          </Reveal>
        </section>

        {/* ---------- availability ---------- */}
        <section id="hiring">
          <Reveal>
            <div className="eyebrow"><span className="n">05</span> Availability</div>
          </Reveal>
          <Reveal delay={80}>
            <OpenToWork />
          </Reveal>
        </section>
      </div>
    </>
  );
}
