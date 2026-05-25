# Izumi Frontend

React/Vite frontend for the Izumi E-Learning platform.

## Local Development

```bash
npm ci
npm run dev
```

Set `VITE_API_BASE_URL` when you need the frontend to call a deployed backend:

```bash
VITE_API_BASE_URL=https://your-backend.example.com/api
```

Without that variable, the app defaults to `http://localhost:5000/api`.

## Vercel Deployment

The frontend is configured for Vercel with `vercel.json`. Client-side routes are rewritten to `index.html` so direct visits to app routes work.

Required GitHub repository secrets for the deploy workflow:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_BASE_URL`

The backend deployment remains separate. If the backend is hosted on Render, keep `VITE_API_BASE_URL` pointed at the Render backend API, for example `https://izumi-e-learning.onrender.com/api`.

On the backend host, set `FRONTEND_URL` or `VERCEL_FRONTEND_URL` to the production Vercel URL. Preview and production `*.vercel.app` origins are also allowed by the backend CORS configuration.
