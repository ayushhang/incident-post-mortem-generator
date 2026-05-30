# Incident Post-Mortem Generator

This repository contains a monorepo with a Next.js frontend and a NestJS backend. The content below describes what is implemented in this codebase today (no exaggeration).

## Implemented Now

- Monorepo layout with `packages/frontend`, `packages/backend`, and `packages/shared`.
- Backend: NestJS application with modules and REST endpoints for auth, incidents, timeline, generation, export, validation, notifications, and admin. The backend entry is [packages/backend/src/main.ts](packages/backend/src/main.ts).
- Frontend: Next.js application in [packages/frontend](packages/frontend) configured to call the API at `NEXT_PUBLIC_API_URL` (defaults to http://localhost:3001).
- Prisma schema and client are present at [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma).
- Docker Compose configuration for local auxiliary services (Postgres, Redis, MinIO) is available at [docker/docker-compose.yml](docker/docker-compose.yml).
- OpenAPI/Swagger support is configured in the backend and served at `/api/docs` when the backend is running.

## Local Dev Options

1. Start backend dev server (watch mode) and serve API + Swagger docs.
2. Start frontend dev server and view the app in the browser.
3. Run Prisma migrations and seed commands from the backend package (requires a configured database).
4. Use the backend REST endpoints for basic CRUD on incidents and timeline events (endpoints exist in code; they require a running DB and env variables).
5. Export incident content to Markdown/PDF using the export logic present in the backend.


## Quick start (local)

1) Start optional local services (recommended if you use Postgres/Redis/MinIO):

```bash
docker compose -f docker/docker-compose.yml up -d
```

2) Backend (in its own terminal):

```bash
cd packages/backend
cp .env.example .env.local
# edit .env.local as needed
npm install
# run migrations if using Postgres
npm run migrate
# optional: seed sample data
npm run seed
npm run dev
```

3) Frontend (in another terminal):

```bash
cd packages/frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:3000`. Backend API runs at `http://localhost:3001` by default; API docs at `http://localhost:3001/api/docs`.

## Where to look in the code

- Backend entry: [packages/backend/src/main.ts](packages/backend/src/main.ts)
- Backend endpoints and modules: [packages/backend/src](packages/backend/src)
- Prisma schema: [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma)
- Frontend app: [packages/frontend](packages/frontend)
- Shared DTOs/types: [packages/shared/src/index.ts](packages/shared/src/index.ts)

## Tests

Run package-local tests. Example:

```bash
cd packages/backend
npm run test
```

