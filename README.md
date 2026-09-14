# Sri Sai Krishna Jewellers

Customer-friendly digital showroom for Sai Baba Gudi Center, Etikoppaka, Andhra Pradesh - 531082.

## Frontend

Open `index.html` directly for the catalogue, enquiry tray, WhatsApp enquiries, live rate estimator, and responsive mobile navigation.

The admin dialog intentionally does not accept a browser-only password. Set `window.SSK_API_BASE_URL` before `app.js` to the deployed API URL so it can request a JWT from `/api/auth/login`.

## Spring Boot API

The `backend` folder contains the JWT-protected admin API. It uses MySQL through `JDBC_DATABASE_URL` and BCrypt password hashes through environment variables.

Required production variables:

- `JDBC_DATABASE_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET` (32+ random characters)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `FRONTEND_ORIGIN`

`GET /api/admin/session` requires `Authorization: Bearer <token>` and verifies the `ADMIN` role.

## Render deployment

1. Push this repository to GitHub.
2. Create a MySQL database on Railway or another MySQL provider and copy its JDBC connection values.
3. Create a Render Web Service from the GitHub repository. Render can use `render.yaml`; set the variables above in the dashboard.
4. Host the static frontend on GitHub Pages or Render Static Site and set `window.SSK_API_BASE_URL` to the API URL.

The public GitHub and Render URLs are created by the account owner during those steps; this workspace has no GitHub or hosting credentials to publish them on your behalf.