import { LINKS } from '../data';
export default function Contact(){
  const mailto = (e)=>{
    e.preventDefault();
    const f=e.target.form;
    const body=encodeURIComponent(`${f.msg.value}\n\n— ${f.name.value}`);
    window.location.href=`mailto:${LINKS.email}?subject=${encodeURIComponent('Portfolio enquiry from '+f.name.value)}&body=${body}`;
  };
  return (
    <div className="layout solo">
      <main>
        <h1 className="page-title">Contact</h1>
        <p className="page-note">Open to Java full-stack, backend and distributed-systems roles. Email is fastest.</p>
        <div className="glass" style={{padding:28,maxWidth:560}}>
          <form className="contact">
            <div className="field"><label>Name</label><input name="name" placeholder="Your name"/></div>
            <div className="field"><label>Email</label><input name="email" type="email" placeholder="you@company.com"/></div>
            <div className="field"><label>Message</label><textarea name="msg" placeholder="What are you working on?"/></div>
            <button className="btn solid" onClick={mailto} style={{alignSelf:'flex-start'}}>Send via email</button>
          </form>
          <div className="divide" style={{margin:'22px 0'}}/>
          <div className="cta">
            <a className="btn" href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            <a className="btn" href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="btn" href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </main>
    </div>
  );
}
