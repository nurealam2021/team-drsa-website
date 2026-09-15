# Team DRSA Website

Production-ready Next.js website and admin CMS for **Team DRSA**.

## What is included

- Responsive Team DRSA company website
- Dynamic company, service, project, leadership, industry, case-study, insight, career and support content
- Visual `/admin` content management panel
- Multi-user admin accounts and RBAC
- Admin audit logging
- Inquiry/consultation workflow
- Global public search
- Dynamic service and project routes
- Security headers, privacy, terms and security pages
- Health endpoint: `/api/health`
- Persistent server-side JSON storage
- Production systemd service
- Nginx reverse proxy
- Node.js 20+ support; installer uses Node.js 22 LTS when Node.js is missing or older than 20
- Automated typecheck, lint and production build
- Automated health check and **real admin login verification** during a fresh installation

## One-command Ubuntu production installation

The repository is designed so a fresh Ubuntu VM can be prepared without manually installing Node.js, Nginx or configuring systemd.

### Requirements

- Ubuntu Server/Desktop VM with Internet access
- A fixed/static IPv4 address already configured on the VM
- The VM must be reachable from the machine that will use the website
- Root/sudo access

> The installer does **not** change Ubuntu networking or create the static IP. Configure the VM's permanent IP first. The installer uses that IP as the website address.

### Fresh installation

Clone the repository:

```bash
cd ~
git clone https://github.com/nurealam2021/team-drsa-website.git
cd team-drsa-website
```

Run the complete installer:

```bash
sudo bash deploy/install.sh
```

The installer asks for the required production information:

```text
Server IPv4 address
Admin email
Admin password
ADMIN_SECRET
```

For example:

```text
Server IPv4 address [192.168.22.252]: 192.168.22.252
Admin email [admin@teamdrsa.com]: admin@teamdrsa.com
Admin password (minimum 12 characters): ********
ADMIN_SECRET (minimum 32 characters): ********************************
```

For a strong secret, generate one with:

```bash
openssl rand -hex 32
```

Do **not** commit the secret, password, `.env.local`, or `/etc/team-drsa/team-drsa.env` to GitHub.

### What the installer does automatically

1. Installs required Ubuntu packages.
2. Installs Node.js 22 LTS if Node.js is missing or below version 20.
3. Creates the non-root `teamdrsa` application user.
4. Installs the application under `/var/www/team-drsa`.
5. Creates persistent storage under `/var/lib/team-drsa-website`.
6. Creates the protected production environment file under `/etc/team-drsa/team-drsa.env`.
7. Copies the environment into the application's `.env.local` with restricted permissions.
8. Seeds the initial Team DRSA website content.
9. Runs `npm ci`.
10. Runs TypeScript validation.
11. Runs ESLint.
12. Runs the production Next.js build.
13. Creates and enables the `team-drsa` systemd service.
14. Creates and enables the Nginx reverse proxy.
15. Starts the website automatically.
16. Checks `/api/health`.
17. On a fresh installation, performs an actual POST login against `/api/admin/login` to verify that the admin account was created and the supplied credentials work.
18. Saves the installation credentials locally in `/root/team-drsa-install-credentials.txt` with mode `600`.

A successful fresh installation ends with:

```text
Health check: PASS
Admin bootstrap/login: PASS
Installation Complete
```

Then open:

```text
http://YOUR-SERVER-IP/
http://YOUR-SERVER-IP/admin
```

## Admin panel

The first administrator is created automatically from the values entered during installation:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SECRET
```

The application stores the administrator password as a salted `scrypt` hash; the plaintext password is not stored in `admin-users.json`.

After logging in, the admin panel can manage the website content and administrative features, including services, projects, inquiries, users/RBAC and audit information supported by the application.

## Persistent data

Production runtime data is stored outside the Git checkout:

```text
/var/lib/team-drsa-website
```

Important files include:

```text
site-content.json
admin-users.json
admin-sessions.json
audit-log.json
analytics.json
inquiries.json
```

Back up this directory regularly. **Do not delete it during normal updates.** Deleting it removes the stored CMS content, admin accounts, sessions, audit records, analytics and inquiries.

Production secrets are stored in:

```text
/etc/team-drsa/team-drsa.env
```

This file must remain private and is not part of the Git repository.

## Database note

The current Team DRSA application does **not** require PostgreSQL/MySQL. Its persistence layer is a server-side JSON storage implementation designed for a single application server.

This is intentional: installing an unused database would add unnecessary services and failure points. The storage layer is separated from the application so PostgreSQL can be introduced later if the deployment needs multiple application instances, high-concurrency editing, larger datasets or advanced reporting.

## Production architecture

```text
Client browser
     |
     | HTTP :80
     v
   Nginx
     |
     | reverse proxy
     v
Next.js / Node.js :3000
     |
     +--> /var/lib/team-drsa-website   persistent application data
     |
     +--> /etc/team-drsa/team-drsa.env protected secrets
```

The Next.js process listens only on `127.0.0.1:3000`; Nginx is the public HTTP entry point.

## Service management

Check service status:

```bash
sudo systemctl status team-drsa --no-pager
```

Restart:

```bash
sudo systemctl restart team-drsa
```

View logs:

```bash
sudo journalctl -u team-drsa -n 100 --no-pager
```

Check health directly:

```bash
curl http://127.0.0.1:3000/api/health
```

Check Nginx:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
```

## Updating an existing production server

Use the repository's update script:

```bash
cd /var/www/team-drsa
sudo bash deploy/update.sh
```

The update process is designed to keep the persistent data directory and production environment outside the Git source tree.

Before making major changes, back up:

```bash
sudo tar -czf /root/team-drsa-data-$(date +%F-%H%M%S).tar.gz /var/lib/team-drsa-website
```

## Windows to Ubuntu deployment warning

Never copy `node_modules` or `.next` from Windows to Ubuntu. Next.js uses platform-specific native packages such as SWC.

Always install dependencies and build on the Ubuntu server:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

## Local development

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run check
```

Or individually:

```bash
npm run typecheck
npm run lint
npm run build
```

## Security checklist

- Use a fixed/static server IP.
- Keep `/etc/team-drsa/team-drsa.env` private.
- Never commit production credentials to GitHub.
- Use a strong admin password.
- Use a random `ADMIN_SECRET` of at least 32 characters.
- Restrict SSH access where possible.
- Allow only required firewall ports.
- Put the production site behind HTTPS when a domain is available.
- Back up `/var/lib/team-drsa-website`.
- Monitor application and Nginx logs.
- Keep Ubuntu, Node.js and application dependencies updated.

## Repository

GitHub:

https://github.com/nurealam2021/team-drsa-website
