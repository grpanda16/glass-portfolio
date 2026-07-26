import { LINKS } from '../data';
export default function ResumeRail(){
  return (
    <aside>
      <div className="rail glass fade">
        <div className="avatar">GP</div>
        <div><h4>Gyanaranjan Panda</h4><div className="role">Java Full Stack Engineer</div></div>
        <div className="divide"/>
        <div className="rrow"><span>Now</span><span>Boeing</span></div>
        <div className="rrow"><span>Exp</span><span>4.5 years</span></div>
        <div className="rrow"><span>Base</span><span>India · Hybrid</span></div>
        <div className="rrow"><span>Focus</span><span>Java · Spring · React</span></div>
        <div className="divide"/>
        <a className="btn solid" href={LINKS.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
        <a className="btn" href={`mailto:${LINKS.email}`}>Email me</a>
      </div>
    </aside>
  );
}
