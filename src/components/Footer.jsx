import { LINKS } from '../data';
export default function Footer(){
  return (
    <footer>
      <span>© {new Date().getFullYear()} Gyanaranjan Panda</span>
      <span>
        <a href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a> ·{' '}
        <a href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      </span>
    </footer>
  );
}
