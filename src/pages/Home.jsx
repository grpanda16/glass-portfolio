import { Link } from 'react-router-dom';
import ResumeRail from '../components/ResumeRail';
import { LINKS } from '../data';
export default function Home(){
  return (
    <div className="layout">
      <main>
        <section className="hero-card withimg glass fade">
          <div className="hero-copy">
            <div className="pill"><span className="pdot"/>Software Engineer · Boeing · India</div>
            <h1>Full stack, <em>Java at the core.</em></h1>
            <p className="lede">
              4.5 years building end to end — Spring Boot microservices and Kafka streams on the
              backend, component-driven React on the front. I build systems that stay reliable and
              readable long after the first release.
            </p>
            <div className="cta">
              <Link className="btn solid" to="/work">View Work</Link>
              <a className="btn" href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
              <a className="btn" href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
          <figure className="hero-figure">
            <picture>
              <source srcSet="/hero.webp" type="image/webp"/>
              <img src="/hero.jpg" alt="Illustration of a developer at work" loading="eager" width="1200" height="800"/>
            </picture>
          </figure>
        </section>
      </main>
      <ResumeRail/>
    </div>
  );
}
