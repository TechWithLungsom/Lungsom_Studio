import { useRef, useState } from 'react';

export default function ContactForm({ service, setService }) {
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const attempt = useRef(null);
  const busy = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const fingerprint = JSON.stringify(fields);
    if (attempt.current?.fingerprint !== fingerprint) {
      attempt.current = { fingerprint, id: crypto.randomUUID() };
    }
    busy.current = true;
    setStatus({ state: 'sending', message: 'Sending your project enquiry…' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, requestId: attempt.current.id }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'We couldn’t send your enquiry. Please try again, or contact me on WhatsApp.');
      setStatus({ state: 'success', message: 'Thank you! Your enquiry has been sent. I’ll reply to the email address you provided.' });
      form.reset();
      setService('Website');
      attempt.current = null;
    } catch (error) {
      setStatus({ state: 'error', message: error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'We couldn’t confirm delivery. Please retry with the same details, or contact me on WhatsApp.'
        : error.message });
    } finally { busy.current = false; }
  }
  const sending = status.state === 'sending';
  return <form id="project-form" onSubmit={submit} aria-busy={sending}>
    <h3>Tell me a little about it.</h3>
    <p className="form-intro">Let’s find the right starting point for your project.</p>
    <fieldset disabled={sending} className="contact-fields">
      <div className="form-row">
        <div className="field"><label htmlFor="name">Your name <span>*</span></label><input id="name" name="name" placeholder="Your name" required autoComplete="name" maxLength={100} /></div>
        <div className="field"><label htmlFor="email">Email address <span>*</span></label><input id="email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" maxLength={200} /></div>
      </div>
      <div className="field"><label htmlFor="service">What would you like to build?</label><select id="service" name="service" value={service} onChange={event => setService(event.target.value)}><option>Website</option><option>Application</option><option>Website &amp; application</option><option>Let’s figure it out</option></select></div>
      <div className="field"><label htmlFor="brief">Your project, in a few words <span>*</span></label><textarea id="brief" name="brief" placeholder="The idea, the goals, the possibilities…" rows={4} required minLength={10} maxLength={4000} /></div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="company-url">Leave this field empty</label><input id="company-url" name="website" tabIndex={-1} autoComplete="off" /></div>
      <button type="submit" className="button primary" disabled={sending}>{sending ? 'Sending…' : 'Send project enquiry'}<span aria-hidden="true">{sending ? '◌' : '↗'}</span></button>
    </fieldset>
    <p className={`form-note form-status ${status.state}`} id="form-status" role="status" aria-live="polite">{status.message || 'Your enquiry is sent directly to Lungsom Studio. Your details are used to respond to your project.'}</p>
  </form>;
}
