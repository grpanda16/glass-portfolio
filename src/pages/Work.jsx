import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import useSeo from '../lib/useSeo';
import { PAGE_SEO } from '../lib/seo';
import { EXPERIENCE, LINKS, STACK } from '../data';

export default function Work() {
  useSeo({ ...PAGE_SEO['/work'], path: '/work' });

  return (
    <div className="wrap page">
      <Reveal className="page-head">
        <span className="pill"><span className="dot" />4.5 years · 4 roles</span>
        <h1 className="h-lg" style={{ margin: '20px 0 16px' }}>
          Where I&apos;ve <span className="gradtext">worked</span>, and on what.
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

        {/* ---------- stack ---------- */}
        <section id="stack">
          <Reveal><div className="eyebrow"><span className="n">02</span> Stack</div></Reveal>

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

        <section>
          <Reveal className="card cta-band">
            <h2 className="h-lg">See what came <span className="gradtext">out of it.</span></h2>
            <p className="lede" style={{ margin: '16px auto 0' }}>
              The platforms behind these roles, and the code that is public.
            </p>
            <div className="cta">
              <Link className="btn solid" to="/projects">View projects →</Link>
              <a className="btn" href={LINKS.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
