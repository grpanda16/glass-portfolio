import { Link } from 'react-router-dom';
import { LINKS } from '../data';

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot-inner">
        <span>© {new Date().getFullYear()} Gyanaranjan Panda · Java Full Stack Engineer</span>
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
