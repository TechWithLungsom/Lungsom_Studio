import './config.js';
import express from 'express';
import helmet from 'helmet';
import { createHash, createHmac } from 'node:crypto';
import { z } from 'zod';
import { createStore } from './store.js';
import { sendEnquiry } from './email.js';

const schema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(1).max(100).refine(value => !/[\r\n]/.test(value)),
  email: z.string().trim().toLowerCase().email().max(200),
  service: z.enum(['Website', 'Application', 'Website & application', 'Let’s figure it out']),
  brief: z.string().trim().min(10).max(4000),
  website: z.string().max(200).optional().default(''),
}).strict();

export function createApp({ config = process.env, repository, deliver = sendEnquiry } = {}) {
  const app = express();
  const store = repository || createStore(config.MONGODB_URI);
  app.disable('x-powered-by');
  // Vercel overwrites forwarding headers; on a standalone server use its socket IP.
  if (config.VERCEL) app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: {
    directives: { 'script-src': ["'self'"], 'style-src': ["'self'", 'https://fonts.googleapis.com'], 'font-src': ["'self'", 'https://fonts.gstatic.com'], 'img-src': ["'self'", 'data:'], 'connect-src': ["'self'"], 'upgrade-insecure-requests': config.NODE_ENV === 'production' ? [] : null },
  } }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/contact', (req, res, next) => {
    const origins = (config.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (req.headers.origin && !origins.includes(req.headers.origin)) return res.status(403).json({ message: 'Please submit your enquiry from the studio website.' });
    if (req.method === 'POST' && !req.is('application/json')) return res.status(415).json({ message: 'Please send a valid enquiry form.' });
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.post('/api/contact', async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Please check your name, email, service and project description (10–4,000 characters).' });
    const { website, ...data } = parsed.data;
    if (website) return res.status(400).json({ message: 'Unable to accept this enquiry.' });
    const configured = ['MONGODB_URI', 'RESEND_API_KEY', 'EMAIL_FROM', 'RATE_LIMIT_SECRET', 'ALLOWED_ORIGINS'].every(key => config[key]?.trim());
    if (!configured) return res.status(503).json({ message: 'Direct enquiries are temporarily unavailable. Please contact me using the WhatsApp or email link.' });
    const fingerprint = createHash('sha256').update(JSON.stringify([data.name, data.email, data.service, data.brief])).digest('hex');
    try {
      let enquiry = await store.get(data.requestId);
      if (enquiry && enquiry.fingerprint !== fingerprint) return res.status(409).json({ message: 'This request has changed. Please refresh and submit again.' });
      if (enquiry?.status === 'sent') return res.json({ ok: true });
      if (enquiry && Date.now() - new Date(enquiry.createdAt).getTime() > 23 * 3600000) return res.status(409).json({ message: 'This enquiry has expired. Please refresh the page before submitting again.' });
      const hash = value => createHmac('sha256', config.RATE_LIMIT_SECRET).update(value).digest('hex');
      const allowed = await Promise.all([
        store.takeLimit(`ip:${hash(req.ip || 'unknown')}`, 5, 15 * 60000),
        store.takeLimit(`email:${hash(data.email)}`, 3, 3600000),
        store.takeLimit('global', 100, 24 * 3600000),
      ]);
      if (allowed.some(value => !value)) { res.set('Retry-After', '3600'); return res.status(429).json({ message: 'Too many enquiries have been submitted. Please try again later or contact me on WhatsApp.' }); }
      if (!enquiry) enquiry = await store.create({ ...data, fingerprint });
      if (enquiry.fingerprint !== fingerprint) return res.status(409).json({ message: 'This request has changed. Please refresh and submit again.' });
      if (enquiry.status === 'sent') return res.json({ ok: true });
      const claimed = await store.claim(data.requestId);
      if (!claimed) return res.status(409).json({ message: 'Your enquiry is still being processed. Please wait a moment before retrying.' });
      let providerId;
      try { providerId = await deliver(claimed, config); }
      catch {
        await store.markFailed(data.requestId);
        return res.status(502).json({ message: 'Your enquiry was saved, but email delivery could not be confirmed. Retry with the same details, or contact me on WhatsApp.' });
      }
      // Provider acceptance is a success even if a later database update fails.
      // Retrying the same ID reuses Resend's idempotency key instead of duplicating mail.
      try { await store.markSent(data.requestId, providerId); }
      catch { console.error('Enquiry delivery status update failed', data.requestId); }
      return res.json({ ok: true });
    } catch {
      console.error('Contact service request failed', data.requestId);
      return res.status(503).json({ message: 'We couldn’t process your enquiry right now. Please retry or contact me on WhatsApp.' });
    }
  });
  app.all('/api/contact', (_req, res) => { res.set('Allow', 'POST'); res.status(405).json({ message: 'Method not allowed.' }); });
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Your enquiry is too large.' });
    return res.status(400).json({ message: 'Invalid enquiry data.' });
  });
  return app;
}
export default createApp();
