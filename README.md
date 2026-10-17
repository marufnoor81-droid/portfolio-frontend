# Portfolio & Journal

A responsive personal portfolio and blog frontend built with React, TypeScript, and Vite. It reads content from the companion Django REST API.

## Screenshots

### Home — light theme

![Portfolio home page in the light theme](./screenshots/home-light.png)

### Home — dark theme

![Portfolio home page in the dark theme](./screenshots/home-dark.png)

### Blog list

![Journal listing with search, category filters, and sorting](./screenshots/blog-list.png)

### Blog detail

![Published article with like and moderated comment controls](./screenshots/blog-detail.png)

### Owner dashboard

![Owner dashboard overview with content-management navigation and portfolio statistics](./screenshots/dashboard.png)

## Tech stack

- React 19, TypeScript, Vite
- React Router 6
- TanStack Query and Axios
- React Markdown (raw HTML is not enabled)
- Lucide React icons, Sonner notifications, CSS custom properties

## Local setup

Requirements: Node.js 18+ and npm, plus the companion backend running locally or deployed.

```powershell
git clone https://github.com/marufnoor81-droid/portfolio-frontend.git
cd portfolio-frontend\portfolio-frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The app runs at `http://localhost:5173/`. In `.env`, set `VITE_API_URL` to the API base URL including `/api`, for example:

```text
VITE_API_URL=http://127.0.0.1:8000/api
```

Run `npm run lint` for linting and `npm run build` for a production build. For local sign-in, create a superuser in the backend with `python manage.py createsuperuser`.

## Routes

| Route | Access |
| --- | --- |
| `/` | Public home |
| `/about` | Public profile, skills, experience, and education |
| `/projects` | Public searchable and filterable project list |
| `/projects/:slug` | Public project detail |
| `/blog` | Public searchable and filterable journal |
| `/blog/:slug` | Public post detail, likes, and comment form |
| `/contact` | Public contact form |
| `/login` | Owner sign-in; no public registration |
| `/dashboard/*` | Authenticated Django superuser only |

## Design direction and tokens

The design follows **Direction A — Minimal Editorial**: warm paper surfaces, clay accents, expressive serif display text, quiet borders, and a matching dark theme.

| Token | Light theme | Dark theme / notes |
| --- | --- | --- |
| Page background | `#f6f4ee` | `#191c1a` |
| Surface | `#fffefa` | `#222623` |
| Soft surface | `#eeece4` | `#292e2a` |
| Main text | `#252621` | `#f1eee6` |
| Muted text | `#77786f` | `#b1b4a8` |
| Accent | `#d66846` | `#ee997c` |
| Display font | Iowan Old Style / Palatino / Georgia, editorial serif | Italic accent for emphasis |
| Body font | Inter with system sans-serif fallbacks | Same |
| Mono font | SFMono-Regular / Consolas | Eyebrows and metadata |
| Spacing scale | `4, 8, 12, 16, 24, 32, 48, 64, 96px` | Shared |
| Corner radii | `8px, 16px, 999px` | Shared |

## Folder structure

```text
portfolio-frontend/
  screenshots/       README screenshots
  src/
    api/             Axios client, API hooks, and TypeScript types
    components/      Layout, blog, UI, and owner dashboard
    context/         Authentication and theme providers
    hooks/           Reusable React hooks
    pages/           Public portfolio, project, blog, contact, and login pages
    routes/          Protected dashboard route
    styles/          Design tokens and responsive global styles
    App.tsx          Application providers and route definitions
    main.tsx         Browser entry point
  .env.example
  package.json
  vite.config.ts
```

## With more time

With more time, I would expand field-level dashboard validation and content search, add more owner-provided project imagery, and improve automated frontend interaction tests.

## Related links

- [Backend repository](https://github.com/marufnoor81-droid/portfolio-backend)
- Live site: **Not deployed yet.**

## Content and privacy

The local database and uploaded files are not part of this repository. Add only accurate owner-approved profile content through the dashboard. Never commit `.env`, access tokens, passwords, or other secrets.
