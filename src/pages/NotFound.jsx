import { Link } from 'react-router-dom';
import useSeo from '../lib/useSeo';

export default function NotFound({ what = 'page' }) {
  useSeo({ title: 'Not found — Gyanaranjan Panda' });

  return (
    <div className="wrap page" style={{ paddingBottom: 80 }}>
      <div className="card cta-band">
        <span className="pill">404</span>
        <h1 className="h-lg" style={{ margin: '20px 0 14px' }}>
          That {what} isn&apos;t <span className="gradtext">here.</span>
        </h1>
        <p className="lede" style={{ margin: '0 auto' }}>
          The link may be out of date, or I may have moved things around.
        </p>
        <div className="cta">
          <Link className="btn solid" to="/">Back home</Link>
          <Link className="btn" to="/writing">Read the writing</Link>
          <Link className="btn" to="/work">See the work</Link>
        </div>
      </div>
    </div>
  );
}
