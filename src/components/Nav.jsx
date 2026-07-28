import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/work', label: 'Work' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const { pathname } = useLocation();

  // close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const cls = ({ isActive }) => (isActive ? 'on' : undefined);

  return (
    <header className={`nav${stuck ? ' stuck' : ''}`}>
      <div className="wrap">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="Gyanaranjan Panda — home">
            <span className="brand-mark" aria-hidden="true">GP</span>
            <span className="brand-name">Gyanaranjan&nbsp;<b>Panda</b></span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={cls}>{l.label}</NavLink>
            ))}
            <Link to="/contact" className="btn solid sm nav-cta">Get in touch</Link>
          </nav>

          <button
            type="button"
            className="burger"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>

        <div id="mobile-nav" className={`mobile-panel${open ? ' open' : ''}`}>
          <nav className="mobile-inner card" aria-label="Mobile">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={cls}>
                {l.label}<span aria-hidden="true">→</span>
              </NavLink>
            ))}
            <NavLink to="/contact" className={cls}>
              Contact<span aria-hidden="true">→</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
