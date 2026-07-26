import { NavLink } from 'react-router-dom';
export default function Nav(){
  const cls = ({isActive}) => isActive ? 'on' : undefined;
  return (
    <nav>
      <div className="navbar glass">
        <NavLink to="/" className="brand">Mr. Gyanaranjan <b>Panda</b></NavLink>
        <div className="menu">
          <NavLink to="/" className={(s)=>'lnk '+(cls(s)||'')} end>Home</NavLink>
          <NavLink to="/work" className={(s)=>'lnk '+(cls(s)||'')}>Work</NavLink>
          <div className="dd">
            <button className="dd-btn">Explore ▾</button>
            <div className="dd-panel glass">
              <NavLink to="/work"><span>Experience</span><small>Four roles, 2021 → now</small></NavLink>
              <NavLink to="/work"><span>Tech Stack</span><small>Java · Spring · React</small></NavLink>
              <NavLink to="/work"><span>Repositories</span><small>Live from GitHub</small></NavLink>
              <NavLink to="/contact"><span>Contact</span><small>Let's talk</small></NavLink>
            </div>
          </div>
          <NavLink to="/contact" className="btn solid">Contact</NavLink>
        </div>
      </div>
    </nav>
  );
}
