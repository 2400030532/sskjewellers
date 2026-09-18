# Sri Sai Krishna Jewellers

Customer-friendly digital showroom for Sai Baba Gudi Center, Etikoppaka, Andhra Pradesh - 531082.

## Frontend

This is a React + Vite website with a customer catalogue, saved designs, WhatsApp enquiries, a dedicated today's-prices section, and responsive browser support.

```bash
npm install
npm run dev
```

Create a production bundle with `npm run build` and preview it with `npm run preview`.

Set `VITE_API_BASE_URL` when the API uses a URL other than `https://ssk-jewellers-api.onrender.com`.

## Spring Boot API

The `backend` folder contains the JWT-protected admin API. It uses PostgreSQL through `JDBC_DATABASE_URL` and BCrypt password hashes through environment variables.

Required production variables:

- `JDBC_DATABASE_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET` (32+ random characters)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `FRONTEND_ORIGIN`
- `METALPRICE_API_KEY`

`GET /api/admin/session` requires `Authorization: Bearer <token>` and verifies the `ADMIN` role.

## Render deployment

1. Push this repository to GitHub.
2. Use an accessible PostgreSQL database. With Supabase, use its **Session pooler** connection details, not the direct `db.<project>.supabase.co` host. The direct host can resolve to IPv6, which is unreachable from some Render services.
3. Create a Render Blueprint from the GitHub repository. `render.yaml` defines both the Spring Boot API and the static frontend.
4. Set the API variables in Render. `JDBC_DATABASE_URL` must be a JDBC URL, for example `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`. Set `DB_USERNAME` and `DB_PASSWORD` to the matching pooler credentials. Do not include angle brackets in the real values. The Transaction Pooler uses port `6543` if you choose that connection mode instead.
5. Set `FRONTEND_ORIGIN` to the exact GitHub Pages origin, such as `https://<github-user>.github.io` or `https://<custom-domain>`, and set the remaining JWT/admin variables. Do not include a repository path or trailing slash. The API URL is normally `https://ssk-jewellers-api.onrender.com`; change it if Render assigns a different URL.
6. Add the MetalpriceAPI key in Render as `METALPRICE_API_KEY`. The frontend calls `/api/rates/live` on the backend, so never place this key in `app.js` or expose it in GitHub Pages. If a key has been shared publicly, rotate it before deployment.

The public GitHub and Render URLs are created by the account owner during those steps; this workspace has no GitHub or hosting credentials to publish them on your behalf.

## Mobile support

This project is a responsive website, designed to work well on phones, tablets, and desktop browsers. Native Android packaging is not part of the current deployment. The existing `android/` folder is retained as an archived wrapper and is not part of the normal web workflow.