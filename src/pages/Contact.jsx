import { useState } from 'react';
import Reveal from '../components/Reveal';
import useSeo from '../lib/useSeo';
import { LINKS, PROFILE } from '../data';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CHANNELS = [
  { key: 'EM', label: 'Email', value: LINKS.email, href: `mailto:${LINKS.email}`, ext: false },
  { key: 'IN', label: 'LinkedIn', value: 'in/gyana16', href: LINKS.linkedin, ext: true },
  { key: 'GH', label: 'GitHub', value: 'grpanda16', href: LINKS.github, ext: true },
  { key: 'CV', label: 'Résumé', value: 'PDF · one page', href: LINKS.resume, ext: true },
];

export default function Contact() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  useSeo({
    title: 'Contact — Gyanaranjan Panda',
    description:
      'Get in touch about Java full-stack, backend and distributed-systems roles. ' +
      'Email, LinkedIn and GitHub.',
    path: '/contact',
  });

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => (err[field] ? { ...err, [field]: undefined } : err));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Please add your name';
    if (!values.email.trim()) next.email = 'Please add an email so I can reply';
    else if (!EMAIL_RE.test(values.email.trim())) next.email = 'That does not look like an email';
    if (values.message.trim().length < 10) next.message = 'A little more detail helps';
    return next;
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const subject = `Portfolio enquiry from ${values.name.trim()}`;
    const body =
      `${values.message.trim()}\n\n` +
      `—\n${values.name.trim()}\n${values.email.trim()}`;

    window.location.href =
      `mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(LINKS.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the mailto link still works */
    }
  };

  return (
    <div className="wrap page">
      <Reveal className="page-head">
        <span className="pill"><span className="dot" />{PROFILE.available}</span>
        <h1 className="h-lg" style={{ margin: '20px 0 16px' }}>
          Let&apos;s <span className="gradtext">talk.</span>
        </h1>
        <p className="lede">
          Java full-stack, backend and distributed-systems roles — or just a good architecture
          argument. Email gets the fastest reply.
        </p>
      </Reveal>

      <div className="contact-grid">
        <Reveal>
          <div className="card" style={{ padding: 'clamp(22px,3.5vw,30px)' }}>
            <form className="contact" onSubmit={submit} noValidate>
              <div className={`field${errors.name ? ' err' : ''}`}>
                <label htmlFor="c-name">Name</label>
                <input
                  id="c-name" name="name" autoComplete="name"
                  placeholder="Your name"
                  value={values.name} onChange={set('name')}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'e-name' : undefined}
                />
                {errors.name && <p className="errmsg" id="e-name">{errors.name}</p>}
              </div>

              <div className={`field${errors.email ? ' err' : ''}`}>
                <label htmlFor="c-email">Email</label>
                <input
                  id="c-email" name="email" type="email" autoComplete="email"
                  placeholder="you@company.com"
                  value={values.email} onChange={set('email')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'e-email' : undefined}
                />
                {errors.email && <p className="errmsg" id="e-email">{errors.email}</p>}
              </div>

              <div className={`field${errors.message ? ' err' : ''}`}>
                <label htmlFor="c-msg">Message</label>
                <textarea
                  id="c-msg" name="message"
                  placeholder="What are you building, and where does it hurt?"
                  value={values.message} onChange={set('message')}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'e-msg' : undefined}
                />
                {errors.message && <p className="errmsg" id="e-msg">{errors.message}</p>}
              </div>

              <button className="btn solid" type="submit" style={{ alignSelf: 'flex-start' }}>
                Compose email →
              </button>

              <p className="post-idx" style={{ lineHeight: 1.6 }}>
                This opens your mail client with the message ready to send — nothing is submitted
                to a server, and nothing is stored.
              </p>
            </form>
          </div>
        </Reveal>

        <Reveal delay={110}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHANNELS.map((c) => (
              <a
                key={c.key}
                className="linkrow"
                href={c.href}
                {...(c.ext ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                <span className="ico" aria-hidden="true">{c.key}</span>
                <span>
                  <span className="lt" style={{ display: 'block' }}>{c.label}</span>
                  <span className="ls">{c.value}</span>
                </span>
                <span className="arw" aria-hidden="true">{c.ext ? '↗' : '→'}</span>
              </a>
            ))}

            <button type="button" className="btn" onClick={copyEmail} style={{ marginTop: 4 }}>
              {copied ? 'Email copied ✓' : 'Copy email address'}
            </button>

            <div className="card" style={{ padding: 22, marginTop: 8 }}>
              <div className="rrow"><span>Now</span><span>{PROFILE.company}</span></div>
              <div className="hr" style={{ margin: '13px 0' }} />
              <div className="rrow"><span>Base</span><span>{PROFILE.location}</span></div>
              <div className="hr" style={{ margin: '13px 0' }} />
              <div className="rrow"><span>Focus</span><span>Java · Spring · Kafka</span></div>
              <div className="hr" style={{ margin: '13px 0' }} />
              <div className="rrow"><span>Reply</span><span>Usually within a day</span></div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
