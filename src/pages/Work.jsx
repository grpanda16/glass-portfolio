import { useEffect, useState } from 'react';
import TiltCard from '../components/TiltCard';
import { EXPERIENCE, STACK, PROJECTS } from '../data';

const USER='grpanda16';
const LANG={Java:'#b07219',JavaScript:'#f1e05a',TypeScript:'#3178c6',HTML:'#e34c26',CSS:'#563d7c',Python:'#3572A5',Shell:'#89e051'};

function Repos(){
  const [repos,setRepos]=useState([]); const [st,setSt]=useState('loading');
  useEffect(()=>{
    fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=100&type=public`)
      .then(r=>r.ok?r.json():Promise.reject()).then(d=>{
        if(!Array.isArray(d)) throw 0;
        const l=d.filter(r=>!r.fork&&r.name!==USER).slice(0,9);
        setRepos(l); setSt(l.length?'ok':'empty');
      }).catch(()=>setSt('error'));
  },[]);
  if(st==='loading') return <p className="state">Loading repositories…</p>;
  if(st!=='ok') return <p className="state">Couldn't load repos just now — <a style={{color:'var(--accent)'}} href={`https://github.com/${USER}`} target="_blank" rel="noreferrer">browse on GitHub →</a></p>;
  return (
    <div className="repo-grid">
      {repos.map(r=>(
        <a className="repo glass" key={r.id} href={r.html_url} target="_blank" rel="noreferrer">
          <div className="rn">{r.name}</div>
          <div className="rd">{r.description||'No description yet.'}</div>
          <div className="rm">
            {r.language && <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:LANG[r.language]||'#6C7A9C',marginRight:6}}/>{r.language}</span>}
            {r.stargazers_count>0 && <span>★ {r.stargazers_count}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

export default function Work(){
  return (
    <div className="layout solo">
      <main>
        <h1 className="page-title">Work</h1>
        <p className="page-note">Four roles since 2021, 4.5 years full-time — plus code straight from GitHub.</p>

        <div className="sec-label">Experience — append-only log</div>
        <div className="cards">
          {EXPERIENCE.map(e=>(
            <TiltCard key={e.offset}>
              <div className="org">{e.org}</div>
              <div className="when">{e.when}</div>
              <h3>{e.role}</h3>
              <ul>{e.bullets.map(b=><li key={b}>{b}</li>)}</ul>
              <div className="chips">{e.tags.map(t=><span className="chip" key={t}>{t}</span>)}</div>
            </TiltCard>
          ))}
        </div>

        <div className="sec-label">Selected projects</div>
        <div className="projgrid">
          {PROJECTS.map(pr=>(
            <TiltCard key={pr.name} className="proj">
              <div className="pname">{pr.name}</div>
              <div className="psub">{pr.sub}</div>
              <div className="pmeta">{pr.role} · {pr.domain}</div>
              <ul>{pr.bullets.map(b=><li key={b}>{b}</li>)}</ul>
              <div className="chips">{pr.tags.map(t=><span className="chip" key={t}>{t}</span>)}</div>
            </TiltCard>
          ))}
        </div>

        <div className="sec-label">Stack</div>
        <div className="cards">
          {STACK.map(([g,items])=>(
            <TiltCard key={g}>
              <div className="org">{g}</div>
              <div className="chips" style={{marginTop:10}}>{items.map(i=><span className="chip" key={i}>{i}</span>)}</div>
            </TiltCard>
          ))}
        </div>

        <div className="sec-label">Repositories — live from GitHub</div>
        <Repos/>
      </main>
    </div>
  );
}
