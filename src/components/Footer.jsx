import { Link } from 'react-router-dom';
import VisitCounter from './VisitCounter';
import { LINKS } from '../data';

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot-inner">
        <span className="foot-left">
          © {new Date().getFullYear()} Gyanaranjan Panda · Java Full Stack Engineer
          <VisitCounter />
        </span>
        <div className="foot-links">
          <Link to="/work">Work</Link>
          <Link to="/writing">Writing</Link>
          <Link to="/contact">Contact</Link>
          <a href={LINKS.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
        </div>
      </div>
    </footer>
  );
}
