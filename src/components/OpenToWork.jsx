import { LINKS, OPEN_TO_WORK } from '../data';

/** Availability banner: status, the role being looked for, and how to reach me. */
export default function OpenToWork() {
  const { status, role, focus, note, facts } = OPEN_TO_WORK;

  return (
    <div className="card otw">
      <div className="otw-body">
        <span className="pill otw-status"><span className="dot" />{status}</span>

        <h2 className="otw-role">
          {role}
          <span className="otw-focus">{focus}</span>
        </h2>

        <p className="lede otw-note">{note}</p>

        <dl className="otw-facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="otw-cta">
          <a className="btn solid" href={`mailto:${LINKS.email}`}>Email me</a>
          <a className="btn" href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
          <a className="btn" href={LINKS.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
        </div>
      </div>
    </div>
  );
}
