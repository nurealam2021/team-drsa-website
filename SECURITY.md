# Security Policy

Team DRSA treats website and client security issues as confidential operational matters.

- Do not publish credentials, private keys, client data, or production environment files in the repository.
- Keep `.env` files outside version control.
- Use unique production `ADMIN_PASSWORD` and `ADMIN_SECRET` values.
- Run the application as a non-root service account behind HTTPS/Nginx.
- Restrict write permission on the persistent data directory to the application service account.
- Back up persistent data and test restoration.
- Apply dependency and operating-system security updates regularly.
- Report suspected vulnerabilities privately through an authorized Team DRSA contact channel.
