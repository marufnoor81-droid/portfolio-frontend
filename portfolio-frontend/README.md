# Portfolio frontend

React, TypeScript, and Vite frontend for a personal portfolio and blog. It connects to a separate Django REST Framework API.

## Requirements

- Node.js 20 or newer
- npm
- The portfolio API running locally or deployed

## Run locally

From this repository's root:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` to the API base URL, including `/api`, for example:

```text
VITE_API_URL=http://127.0.0.1:8000/api
```

The Vite development server is available at `http://localhost:5173/`. Run `npm run lint` for linting and `npm run build` for a production build.

## Backend

This frontend needs the companion Django API. Configure its `CORS_ALLOWED_ORIGINS` to include the frontend origin. The backend repository contains setup instructions and the Postman collection.

## Content and privacy

No example biography, work history, or projects are seeded. Add only accurate owner-provided content through the owner dashboard. Do not commit `.env` files, tokens, passwords, or other secrets.
