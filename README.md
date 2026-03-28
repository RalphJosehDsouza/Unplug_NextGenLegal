# NextGenLegal (Legal Tech) - Frontend + Backend Starter

This repo contains a React + TailwindCSS (ShadCN UI) frontend and an Express + Sequelize + PostgreSQL backend for the NextGenLegal platform.

## Tech Stack
- Node.js + Express (API server)
- Sequelize ORM + PostgreSQL 15
- Redis (ioredis) for rate limiting + caching
- JWT auth (access token) + httpOnly refresh cookie
- AWS S3 (SDK v3) for secure document storage
- Puppeteer + Handlebars for server-side document generation
- Gemini (server-side chatbot) + ActivityLog persistence
- Compliance monitoring + cron notifications (email/SMS/WhatsApp + in-app notifications)

## Key Frontend Routes
- `/documents` -> Document Studio (template library)
- `/doc-studio/generate/:template_name` -> document generator form + live preview
- `/my-documents` -> secure document download list
- `/lawyers` -> lawyer directory search + pagination
- `/lawyers/:id` -> lawyer profile + slot picker + booking flow
- `/my-bookings` -> upcoming/past bookings + reviews
- `/compliance` -> compliance Kanban + add/edit tasks + notification bell

## Key Backend Routes
- Auth: `/api/auth/*`
- Documents: `/api/docs/*`
- Lawyers: `/api/lawyers*`
- Bookings: `/api/bookings*`
- Reviews: `/api/bookings/:id/review`
- Compliance: `/api/compliance*`
- Notifications: `/api/notifications*`
- Chatbot: `/api/chat`

## Configuration
Backend env template: `app/backend/.env.example`
Docker services: `app/docker-compose.yml`

## Notes
Some integrations (Razorpay, Daily.co, MSG91, SMTP, S3, Gemini) require you to set the corresponding env vars before running those flows.

Implementation inventory: `app/docs/NEXTGENLEGAL_IMPLEMENTED.md`.

