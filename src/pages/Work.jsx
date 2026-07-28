import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import useSeo from '../lib/useSeo';
import { EXPERIENCE, LINKS, PROJECTS, STACK } from '../data';

const USER = 'grpanda16';

const LANG_COLOR = {
  Java: '#b07219', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
  CSS: '#563d7c', Python: '#3572A5', Shell: '#89e051', Kotlin: '#A97BFF', Dockerfile: '#384d54',
};

function Repos() {
  const [repos, setRepos] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const ac = new AbortController();

    fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=100&type=public`, {
      signal: ac.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub responded ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('unexpected payload');
        const list = data.filter((r) => !r.fork && r.name !== USER).slice(0, 9);
        setRepos(list);
        setStatus(list.length ? 'ok' : 'empty');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('error');
      });

    return () => ac.abort();
  }, []);

  if (status === 'loading') {
    return (
      <div className="repogrid" aria-busy="true" aria-label="Loading repositories">
        {[0, 1, 2].map((i) => <div className="skel" key={i} />)}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <p className="state">
        No public repositories to show right now —{' '}
        <a href={LINKS.github} target="_blank" rel="noreferrer">profile on GitHub →</a>
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="state">
        Couldn&apos;t reach the GitHub API just now —{' '}
        <a href={LINKS.github} target="_blank" rel="noreferrer">browse the repositories directly →</a>
      </p>
    );
  }

  return (
    <div className="repogrid">
      {repos.map((r, i) => (
        <Reveal key={r.id} delay={Math.min(i, 5) * 60}>
          <a className="card hoverable repo" href={r.html_url} target="_blank" rel="noreferrer"
             style={{ height: '100%' }}>
            <div className="rn">{r.name}<span className="arw" aria-hidden="true">↗</span></div>
            <div className="rd">{r.description || 'No description yet.'}</div>
            <div className="rm">
              {r.language && (
                <span>
                  <i className="lang-dot" style={{ background: LANG_COLOR[r.language] || '#6C7A9C' }} />
                  {r.language}
                </span>
              )}
              {r.stargazers_count > 0 && <span>★ {r.stargazers_count}</span>}
              {r.forks_count > 0 && <span>⑂ {r.forks_count}</span>}
            </div>
          </a>
        </Reveal>
      ))}
    </div>
  );
}

export default function Work() {
  useSeo({
    title: 'Work — Gyanaranjan Panda',
    description:
      'Four engineering roles since 2021. Spring Boot microservices, Kafka pipelines, ' +
      'authentication systems and the platforms they run inside.',
    path: '/work',
  });

  return (
    <div className="wrap page">
      <Reveal className="page-head">
        <span className="pill"><span className="dot" />4.5 years · 4 roles</span>
        <h1 className="h-lg" style={{ margin: '20px 0 16px' }}>
          What I&apos;ve <span className="gradtext">built</span>, and where.
        </h1>
        <p className="lede">
          Backend-heavy full stack since 2021 — event-driven services in healthcare e-commerce and
          financial document management, plus whatever the front end needed to do them justice.
        </p>
      </Reveal>

      <div className="stack-lg" style={{ paddingBottom: 'clamp(20px,4vw,40px)' }}>
        {/* ---------- experience ---------- */}
        <section id="experience">
          <Reveal><div className="eyebrow"><span className="n">01</span> Experience</div></Reveal>

          <div className="timeline">
            {EXPERIENCE.map((e, i) => (
              <Reveal key={e.id} delay={i * 80} className={`tl-item${e.current ? ' now' : ''}`}>
                <article className="card hoverable role-card">
                  <div className="role-head">
                    <div>
                      <div className="role-org">{e.org}</div>
                      <h3>
                        {e.role}
                        {e.current && <span className="role-now">Current</span>}
                      </h3>
                      <div className="role-place">{e.place}</div>
                    </div>
                    <div className="role-when">{e.when}</div>
                  </div>

                  <ul className="dash">
                    {e.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>

                  <div className="chips" style={{ marginTop: 16 }}>
                    {e.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- projects ---------- */}
        <section id="projects">
          <Reveal><div className="eyebrow"><span className="n">02</span> Selected projects</div></Reveal>

          <div className="projects">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.name} delay={i * 90}>
                <article className="card hoverable proj">
                  <div className="proj-top">
                    <div className="proj-name">{p.name}</div>
                    <div className="proj-sub">{p.sub}</div>
                    <div className="proj-meta">{p.role} · {p.domain}</div>
                    <p className="lede" style={{ fontSize: 14.5, marginTop: 14 }}>{p.summary}</p>
                  </div>

                  <div className="proj-body">
                    <ul className="dash">
                      {p.bullets.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                  </div>

                  <div className="proj-foot">
                    <div className="chips">
                      {p.tags.map((t) => <span className="chip" key={t}>{t}</span>)}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- stack ---------- */}
        <section id="stack">
          <Reveal><div className="eyebrow"><span className="n">03</span> Stack</div></Reveal>

          <div className="stackgrid">
            {STACK.map(([group, items], i) => (
              <Reveal key={group} delay={Math.min(i, 6) * 60}>
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

        {/* ---------- repos ---------- */}
        <section id="repositories">
          <Reveal>
            <div className="eyebrow"><span className="n">04</span> Repositories · live from GitHub</div>
          </Reveal>
          <Repos />
        </section>

        <section>
          <Reveal className="card cta-band">
            <h2 className="h-lg">Want the <span className="gradtext">detail</span> behind any of this?</h2>
            <p className="lede" style={{ margin: '16px auto 0' }}>
              Happy to walk through architecture decisions, trade-offs and what I&apos;d do differently.
            </p>
            <div className="cta">
              <Link className="btn solid" to="/contact">Get in touch</Link>
              <a className="btn" href={LINKS.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
