# Lungsom Studio — MERN

React + Vite frontend, Express/Node.js API, MongoDB with Mongoose, and direct server-side email through Resend. The studio design, mobile navigation, service links and WhatsApp contact are preserved.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The API runs on http://127.0.0.1:3001; Vite proxies `/api` to it. Frontend changes reload automatically; restart `npm run dev` after backend or `.env` edits. Without the service credentials, the design can be previewed, but contact submissions return an honest unavailable message. No emails are simulated in the running application.

For a production-style local run:

```sh
npm run build
npm start
```

Open http://localhost:3001. The old `python3 -m http.server` command cannot run this app's backend.

## Configure MongoDB Atlas

1. Create your own account at https://www.mongodb.com/cloud/atlas/register and a cluster.
2. Create a database user with read/write access to the `lungsom_studio` database.
3. Add the IP addresses of your development/deployment environment under Network Access. Use the documented Vercel/Atlas networking options for production; never disable database authentication.
4. Choose **Connect → Drivers**, copy the Node.js connection URI, substitute your database username/password (URL-encoded), and set the database name to `lungsom_studio`.
5. Put it in `.env` as `MONGODB_URI`. The application creates collections/indexes on its first valid submission.

Atlas guide: https://www.mongodb.com/docs/atlas/getting-started/

Enquiries are saved in `enquiries`, including delivery status. The app has no public enquiry-list endpoint or admin dashboard. View records using your Atlas account. Rate-limit counters expire automatically; enquiry records do not auto-expire, so delete records when no longer needed.

## Configure direct email

1. Create your own account at https://resend.com.
2. Add and verify a domain you own, following Resend's DNS instructions.
3. Create a sending API key and set `RESEND_API_KEY` in `.env`.
4. Set `EMAIL_FROM` to an address on your verified domain, e.g. `Lungsom Studio <hello@yourdomain.com>`.
5. Keep `CONTACT_TO=lungsomlamnio@gmail.com`. This is the fixed recipient; visitors cannot choose recipients.
6. Set `RATE_LIMIT_SECRET` to a long random value. Generate one with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Visitors' addresses are used as Reply-To, never as the sender. A Gmail recipient is fine, but you cannot verify `gmail.com` as your own sending domain. Resend's testing sender may only send to the email address associated with your Resend account; use it only under their testing restrictions, not as a substitute for production domain setup.

Docs: https://resend.com/docs/send-with-nodejs and https://resend.com/docs/dashboard/domains/introduction

Do not put keys in React code, prefix them with `VITE_`, commit `.env`, or paste keys into chat. Store them locally or in Vercel's Environment Variables settings.

## Deploy on Vercel

Deploy the **project root**, not `dist` or `client`.

1. Push the project to your own Git repository and import it into Vercel, or run `npx vercel` from this directory.
2. Keep the repository root as Root Directory. `vercel.json` supplies the Vite build, `build` output, and Express API rewrite.
3. Add server variables: `MONGODB_URI`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_TO`, `RATE_LIMIT_SECRET`, and `ALLOWED_ORIGINS`.
4. Set `ALLOWED_ORIGINS` to your exact live origin without a trailing slash, e.g. `https://your-project.vercel.app`. Add a custom domain or specific preview origin separated by commas if needed. Do not use `*`.
5. Enable Atlas network access for the deployment environment.
6. Deploy or redeploy after setting the variables. For CLI production deployment, run `npx vercel --prod` from the project root.
7. Confirm `/api/health` responds, then submit a real enquiry and check both the inbox and MongoDB status. An API success means the email provider accepted the message; final inbox delivery can still be affected by spam filters or bounces.

The Node API is exported from `api/index.js` without starting a listener. `/api/contact` accepts POST only. Standalone hosting uses `server/index.js`.

Vercel Node functions: https://vercel.com/docs/functions/runtimes/node-js

The existing Sites URL still serves the previous static version. MERN requires a Node host and MongoDB connectivity; this migration is prepared for Vercel and has not replaced the Sites deployment. The `dist/` directory and `.openai/hosting.json` are legacy artifacts, not MERN deployment inputs.

## Submission behavior

- Validates all fields on the server, enforces a 16KB payload limit, and rejects unexpected fields.
- Saves each enquiry before attempting email delivery.
- Shows sending, success, timeout and error feedback; preserves input after failure.
- Retries reuse the same request ID and Resend idempotency key. Expired attempts require a refresh.
- MongoDB-backed limits apply per IP, per email and globally; a honeypot reduces simple spam. Origin checks restrict browser submissions, but are not a substitute for bot protection. Add a managed challenge if targeted abuse occurs.
- A failed delivery remains saved with `failed` status. There is no background retry worker; the visitor can retry, and the owner can inspect saved records.

## Verify

```sh
npm test
npm run build
```

Tests run against a temporary real MongoDB process, with a mocked email sender (no actual email is sent). The first test run downloads a MongoDB binary into `work/mongodb-binaries`. They cover persistence, duplicate requests, concurrent submissions, email failure/retry, validation, origin rejection, rate limits and email transport fields.

## Project layout

- `client/src/App.jsx`: React website and navigation
- `client/src/ContactForm.jsx`: direct enquiry form
- `client/src/style.css`: responsive visual design
- `server/app.js`: Express API, validation and abuse controls
- `server/store.js`: MongoDB connection, records and atomic limits
- `server/email.js`: server-side Resend integration
- `api/index.js`: Vercel function entry
- `.env.example`: configuration template

## Startup troubleshooting

Settings belong in `.env` next to `package.json`. `.env.example` is only a shareable template. The server resolves `.env` from its own project root, even when started from another directory. Restart `npm run dev` after changing it.

During development, open http://localhost:5173. The API runs on port 3001 and does not require `build/index.html`. For a production-style local run, run `npm run build` before `npm start`.
