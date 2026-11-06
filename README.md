# QueueMe 🍿📚🎧

**QueueMe** is a sleek, modern personal media queue tracker designed to organize your movies, videos, articles, books, courses, and audio in one focused workspace.

Built with a decoupled monorepo architecture featuring a **React 19** frontend, an **Express 5** REST API, and a **PostgreSQL 17** database managed with **Prisma ORM**.

---

## 🏛 Architecture & Project Structure

QueueMe is structured as a decoupled monorepo with distinct `client/` and `server/` packages:

```text
queueme/
├── client/                          # Frontend (React 19 + Vite 8 + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/              # UI components (dashboard, items, filters, modals)
│   │   ├── hooks/
│   │   │   └── useQueueStorage.js   # Optimistic UI updates, API sync & LocalStorage fallback
│   │   ├── services/
│   │   │   ├── apiService.js        # Centralized HTTP client for backend REST API
│   │   │   └── storageService.js    # Data sanitization, validation & LocalStorage backup
│   │   ├── data/sampleData.js       # Category definitions, status configs & sample items
│   │   ├── App.jsx                  # Main application shell & keyboard listeners
│   │   └── main.jsx                 # React root mount
│   ├── public/                      # Static assets & icons
│   ├── index.html                   # HTML entry template
│   ├── vite.config.js               # Vite config with Tailwind v4 & /api dev proxy
│   └── package.json                 # Frontend dependencies & build scripts
│
├── server/                          # Backend API (Express 5 + Prisma 6 + PostgreSQL)
│   ├── prisma/
│   │   ├── schema.prisma            # PostgreSQL schema, enums (MediaType, ItemStatus, ItemPriority)
│   │   ├── migrations/              # SQL migration history
│   │   └── seed.js                  # Database seeder (15 items including Audio category)
│   ├── src/
│   │   ├── app.js                   # Express app configuration (CORS, healthcheck, routes)
│   │   ├── index.js                 # Server entry point & graceful shutdown handlers
│   │   ├── prisma.js                # PrismaClient singleton
│   │   ├── controllers/             # Item CRUD controllers & reset endpoint
│   │   ├── routes/                  # Express route handlers & middleware validation
│   │   ├── validators/              # Zod validation schemas & status/progress sync logic
│   │   ├── middlewares/             # Centralized error handler & status normalization
│   │   └── data/                    # Server-side seed definitions
│   ├── test/
│   │   ├── qa_audit.test.js         # 114-test end-to-end QA audit suite (100% pass)
│   │   ├── api.test.js              # Supertest REST API integration tests
│   │   ├── persistence.test.js      # Server restart & process reboot persistence tests
│   │   └── phase2.test.js           # apiService & client-backend integration tests
│   ├── .env.example                 # Backend environment variable template
│   └── package.json                 # Backend dependencies & test scripts
│
├── docker-compose.yaml              # Local PostgreSQL 17 container on port 5434
├── .env.example                     # Root environment variable template
├── .env                             # Local development environment configuration
├── eslint.config.js                 # Unified ESLint configuration
└── package.json                     # Monorepo workspace orchestration & npm scripts
```

---

## ⚡ Core Features

- **Multi-Media Tracking**: Movies & TV, Videos, Articles, Books, Courses, and **Audio** (podcasts, audiobooks, albums with dedicated `sourceUrl` streaming links).
- **Relational PostgreSQL Persistence**: True server-side persistence independent of local browser storage.
- **Resilient Fallback**: Optimistic 0ms UI updates backed by PostgreSQL with automatic LocalStorage caching if offline.
- **Search & Tag Queries**: Case-insensitive instant search across title, creator, platform, and tags (`?search=%23AI`).
- **Granular Filtering & Sorting**: Filter by media type, status (`queued`, `in_progress`, `completed`), and priority (`high`, `medium`, `low`); sort by recent, priority, progress, or title.
- **Auto-Synchronized Progress**: Setting an item to `completed` automatically marks progress at 100% ("Finished"); moving to `queued` resets progress to 0%.
- **Rating Normalization**: Unified 1.0–5.0 star scale with automatic 10-point legacy scaling.
- **Keyboard Shortcuts**: Quick modal triggers and navigation (`a` for Add Item, `r` for Reset confirmation, `?` for Shortcuts overlay, `Esc` to close).

---

## 📋 Prerequisites

- **Node.js**: `v18+` (Tested on `v24.x`)
- **npm**: `v9+`
- **PostgreSQL**: `v14+` or **Docker**

---

## 🐳 Quick Start with Docker

The fastest way to spin up the local PostgreSQL database:

```bash
# 1. Start PostgreSQL 17 container
docker compose up -d

# 2. Verify container is healthy (running on port 5434)
docker ps
```

---

## ⚙️ Environment Configuration

1. Copy the example environment file at the root:
   ```bash
   cp .env.example .env
   ```

2. Review the configuration:
   ```env
   # Server configuration
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:5173"

   # PostgreSQL connection string via Prisma (matches docker-compose.yaml)
   DATABASE_URL="postgresql://queueme_user:queueme_local_dev@127.0.0.1:5434/queueme_db?schema=public"
   ```

3. *(Optional for frontend)*: In `client/`, create `.env` if pointing to a non-default API:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```

---

## 🗄 Database Setup & Migrations

Run from the repository root:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Apply migrations to PostgreSQL
npm run prisma:migrate

# 3. Seed database with initial 15 items (including Audio)
npm run prisma:seed

# 4. (Optional) Open Prisma Studio visual GUI
npm run prisma:studio
```

---

## 🚀 Running the Application

### Option A: From Repository Root (Recommended)

```bash
# Terminal 1: Start Express Backend API (http://localhost:5000)
npm run server:dev

# Terminal 2: Start React Frontend (http://localhost:5173)
npm run dev
```

### Option B: From Individual Packages

```bash
# Frontend
cd client
npm run dev

# Backend
cd server
npm run dev
```

---

## 🧪 Testing & QA Verification

QueueMe includes a comprehensive test suite across unit, integration, persistence, and end-to-end QA:

| Command | Target | Description |
| :--- | :--- | :--- |
| `npm run test:qa` | Full QA Audit | **114 / 114 tests passing** across 22 test suites (CRUD, search, filters, audio, sorting, progress sync, validation, restarts, LocalStorage independence) |
| `npm run test:backend` | API Integration | Supertest suite validating HTTP endpoints, status codes, and JSON response envelopes |
| `npm run test:persistence` | Process Restarts | Validates data survival across server process death and fresh reboots |
| `npm run test:phase2` | Client Integration | Validates `apiService.js` against live PostgreSQL instance |
| `npm run lint` | Code Quality | ESLint code quality checks across client and server |
| `npm run build` | Production Build | Compiles Vite production bundle |

To run the complete end-to-end QA audit:
```bash
npm run test:qa
```

---

## 🚀 Production Deployment Guide

### 🔄 What it was previously using (Legacy Phase 1)

In its initial implementation, QueueMe was a **pure client-side Single Page Application (SPA)**:
- **Storage**: Data lived exclusively in the browser's `window.localStorage`.
- **Hosting Method**: Built into static files (`npm run build` → static HTML, JS, CSS) and deployed to **static-only hosts**:
  - GitHub Pages
  - Vercel (static site preset)
  - Netlify (static publish directory)
  - Render / Cloudflare Pages (static site)
- **Limitations of Previous Setup**:
  - No database or backend API.
  - Data was restricted to a single browser profile on a single machine.
  - Clearing cookies/cache or using Incognito resulted in data loss.
  - No server-side schema validation, relational queries, or multi-device synchronization.

---

### 🌐 What it should use now to deploy (Current Full-Stack Architecture)

QueueMe is now a **production-ready full-stack application** with a React frontend, an Express API, and a PostgreSQL database. A modern production deployment requires three coordinated tiers:

```mermaid
flowchart LR
    Browser["Client Browser"] -->|"Static Assets (HTML/JS/CSS)"| CDN["Vercel / Netlify / Cloudflare Pages"]
    Browser -->|"REST API Requests (/api/*)"| Backend["Express API (Render / Railway / Fly.io)"]
    Backend -->|"Prisma ORM"| DB[("Managed PostgreSQL (Supabase / Neon / RDS)")]
```

#### 1. Database Tier: Managed PostgreSQL
Deploy a cloud-managed PostgreSQL database instance:
- **Recommended Providers**:
  - [Neon](https://neon.tech/) (Serverless Postgres)
  - [Supabase](https://supabase.com/) (Managed PostgreSQL)
  - [Railway Postgres](https://railway.app/)
  - [Render Postgres](https://render.com/)
  - AWS RDS / DigitalOcean Managed Databases
- **Release Step**: In your CI/CD pipeline or deployment build hook, execute:
  ```bash
  npx prisma migrate deploy --schema=server/prisma/schema.prisma
  ```

#### 2. Backend Tier: Express REST API
Deploy the `server/` directory as a Node.js web service or Docker container:
- **Recommended Platforms**: [Railway](https://railway.app/), [Render](https://render.com/), [Fly.io](https://fly.io/), [AWS App Runner](https://aws.amazon.com/apprunner/), or [Heroku].
- **Build Command**:
  ```bash
  npm --prefix server install && npm --prefix server run prisma:generate
  ```
- **Start Command**:
  ```bash
  node server/src/index.js
  ```
- **Required Production Environment Variables**:
  ```env
  NODE_ENV=production
  PORT=5000
  DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
  CORS_ORIGIN="https://your-frontend-domain.com"
  ```

#### 3. Frontend Tier: React SPA
Deploy the `client/` directory to an edge CDN or static hosting platform:
- **Recommended Platforms**: [Vercel](https://vercel.com/), [Netlify](https://netlify.com/), [Cloudflare Pages](https://pages.cloudflare.com/), or [AWS Amplify].
- **Root Directory**: `client`
- **Build Command**:
  ```bash
  npm run build
  ```
- **Output Directory**: `dist` (or `client/dist`)
- **Required Frontend Environment Variable**:
  ```env
  VITE_API_URL="https://your-backend-api-domain.com/api"
  ```
- **SPA Rewrite Rule**: Ensure all non-file routes redirect to `/index.html` (e.g. `/* -> /index.html 200` in `_redirects` or `vercel.json`).

#### 4. Alternative: Single VPS / Docker Deployment
For single-server deployment (DigitalOcean Droplet, Hetzner, AWS EC2):
- Run PostgreSQL via Docker Compose.
- Serve the Express backend with PM2 or Docker.
- Configure Nginx or Caddy as a reverse proxy:
  - Route `/api/*` to `http://127.0.0.1:5000`
  - Route all static requests directly to the built `client/dist/` directory.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, uptime, and timestamp |
| `GET` | `/api/items` | List items with search, filters, and sorting |
| `GET` | `/api/items/:id` | Retrieve single item by ID |
| `POST` | `/api/items` | Create new item with Zod validation |
| `PATCH` | `/api/items/:id` | Update item fields (auto-syncs status & progress, preserves unmentioned fields) |
| `PUT` | `/api/items/:id` | Replace / full update item fields |
| `DELETE` | `/api/items/:id` | Delete item by ID |
| `POST` | `/api/items/reset` | Reset PostgreSQL items back to initial sample dataset |

---

### Query Parameters for `GET /api/items`

- `type`: Filter by media type (`all`, `movie`, `video`, `article`, `book`, `course`, `audio`).
- `status`: Filter by status (`all`, `queued`, `in_progress`, `completed`).
- `priority`: Filter by priority (`all`, `high`, `medium`, `low`).
- `search`: Case-insensitive text search matching `title`, `creator`, `platform`, or `tags`. Prefix with `#` (e.g. `?search=%23AI`) to filter strictly by tag name.
- `sortBy`: Sort order (`recent`, `priority`, `progress`, `title`). Defaults to `recent`.

---

### Data Schema & Validation Rules

```json
{
  "id": "qm-13",
  "title": "Lex Fridman Podcast #419 – Sam Altman: OpenAI, GPT-5, Sora & AI Future",
  "type": "audio",
  "creator": "Lex Fridman",
  "platform": "Spotify / Lex Fridman Podcast",
  "duration": "3 hr 42 min",
  "progress": 55,
  "progressLabel": "2 hr 2 min listened (55%)",
  "status": "in_progress",
  "priority": "high",
  "releaseYear": "2024",
  "rating": "4.8",
  "tags": ["AI", "Podcasts", "Sam Altman", "OpenAI"],
  "coverImage": "https://images.unsplash.com/...",
  "url": "https://www.youtube.com/watch?v=...",
  "sourceUrl": "https://open.spotify.com/episode/lex-fridman-419",
  "notes": "Incredible deep dive into GPT-5 capabilities and AI alignment philosophy.",
  "addedDate": "2026-10-05",
  "createdAt": "2026-10-18T14:21:22.000Z",
  "updatedAt": "2026-10-18T14:21:22.000Z"
}
```

- **Status & Progress Sync**:
  - Updating `status` to `"completed"` automatically sets `progress: 100` and `progressLabel: "Finished"`.
  - Updating `status` to `"queued"` automatically sets `progress: 0` and `progressLabel: "Not started"`.
  - Updating `status` to `"in_progress"` without specifying progress defaults to `25%`.
- **Rating Normalization**: Clamped to `1.0–5.0` with 1-decimal precision. Legacy 10-point scale ratings are automatically converted.
- **Tag Sanitization**: Commas, arrays, and `#` prefixes are sanitized to clean string arrays on write.
- **Partial Update Safety**: `PATCH` updates only modify supplied fields, preserving existing tags, progress, and metadata.

---

## 📄 License

MIT License. Designed and built with ❤️ for media enthusiasts and queue organizers.
