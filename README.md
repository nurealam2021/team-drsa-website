# Team DRSA Website

Production-oriented Next.js company website for **Team DRSA**.

## Implemented

- Responsive public company website
- Dynamic structured content model for company details, services, leadership, industries, projects, case studies, insights, careers and support
- Persistent server-side content storage
- Authenticated `/admin` content studio with multi-user RBAC
- Consultation/inquiry workflow with server validation, anti-spam honeypot and rate limiting
- Admin inquiry status workflow: new → reviewing → contacted → qualified → closed
- Optional inquiry webhook integration
- Functional global search across public content
- Dynamic service, profile, project, case-study, insight and career routes
- Privacy, Terms and Security pages
- Dynamic sitemap and robots rules
- Health endpoint at `/api/health`
- Security response headers
- Multi-user admin roles, protected sessions and audit logging
- Exact dependency versions, TypeScript check, ESLint, smoke tests and production build scripts

## Local development

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

Or run all checks:

```bash
npm run check
```

## Admin

For the **first** Super Admin bootstrap, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SECRET` in the environment, restart the application, then open:

```text
/admin
```

After the first Super Admin is created, additional administrators, roles, account status, password resets, inquiries, analytics and audit records can be managed from `/admin`. The site content editor uses the same validated content API consumed by the public website.

## Persistent data

By default, runtime data is written under `./data`. For Ubuntu production, use a dedicated persistent directory:

```bash
sudo mkdir -p /var/lib/team-drsa-website
sudo chown -R $USER:$USER /var/lib/team-drsa-website
```

Then configure:

```env
TEAM_DRSA_STORAGE_DIR=/var/lib/team-drsa-website
```

Back up this directory regularly. `site-content.json` contains editable website content and `inquiries.json` contains submitted business inquiries.


## Fixing the Windows/Ubuntu dependency problem

Do **not** copy `node_modules` or `.next` from Windows to Ubuntu. Next.js installs platform-specific SWC packages; a Windows dependency tree contains `@next/swc-win32-*`, while Ubuntu requires `@next/swc-linux-*`.

On a clean Ubuntu checkout:

```bash
cp .env.example .env.local
nano .env.local
./scripts/bootstrap-production.sh
```

The bootstrap script removes any stale `node_modules`/`.next`, performs a clean `npm ci`, verifies TypeScript, ESLint and smoke tests, and then runs `next build`.

If doing it manually:

```bash
rm -rf node_modules .next
npm ci
npm run verify
npm run build
```

Node.js **20.9 or newer** is required.

## Production deployment outline

1. Install supported Node.js and Nginx.
2. Clone/copy this clean source tree. Do **not** deploy `node_modules`, `.next`, or a Python virtual environment from another machine.
3. Run `npm ci` and `npm run build` on the server.
4. Configure `.env` securely outside version control.
5. Run `npm start -- -H 127.0.0.1 -p 3000` under systemd or PM2 as a non-root user.
6. Reverse proxy the domain through Nginx.
7. Enable HTTPS with a trusted certificate.
8. Allow only required firewall ports (normally 22, 80, 443).
9. Back up the persistent data directory.
10. Monitor `/api/health`, application logs, disk space, certificate expiry, and dependency/security updates.

## Future database migration

The website currently uses an intentionally simple persistence layer in `lib/storage.ts`, suitable for a single Ubuntu application instance. The UI and API are separated from storage so PostgreSQL can replace JSON persistence when multi-instance deployment, advanced reporting, concurrent editors, or larger volumes require it.
