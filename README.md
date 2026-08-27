# SpendWise

SpendWise is a full-stack expense tracker with phone OTP, demo, and optional Google authentication.

## Run locally

Start the API in one terminal:

```bash
cd server
npm install
npm run dev
```

Start the frontend in another:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and expects the API at `http://localhost:5050/api`. Configure the server environment from `server/.env`; do not commit credentials.

If demo login returns `503`, open MongoDB Atlas, add your current IP under **Network Access**, wait for the rule to activate, and restart the server. The API remains available while the database is offline and reports this configuration error instead of hanging.

## Verification

```bash
cd client
npm run build
npm run lint
```

Manual smoke test: open the frontend, use Demo Login, add an expense, edit it, delete it, search for it, inspect the category report, and download the monthly PDF.

## Deployment

1. Deploy the `server` directory to a Node hosting service with `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and `DEMO_AUTH` configured.
2. Set `CLIENT_URL` to the deployed frontend origin and configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` when enabling Google OAuth.
3. Set `client/.env` `VITE_API_URL` to the deployed API URL, then run `npm run build` and deploy `client/dist` as a static site.
4. Confirm CORS, `/`, `/api/auth/me`, expense CRUD, and `/api/reports/monthly` from the deployed frontend.

## Feature phases

React setup, authentication, the main layout, dashboard, add expense, expense CRUD, categories, monthly reports, PDF download, optional Google/mobile login, UI polish, and build/lint deployment checks are implemented in the client and server packages.