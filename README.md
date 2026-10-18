# QueueMe 🍿📚🎧

**QueueMe** is a sleek, modern personal media queue tracker designed to organize your movies, videos, articles, books, courses, and audio in one focused workspace.

---

## 🏛 Architecture & Phase 1 Scope

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React icons.
  > **Phase 1 Note**: The frontend currently operates client-side with robust `localStorage` caching, data validation, and recovery mechanisms.
- **Backend (Phase 1)**: Express 5, Prisma ORM 6, PostgreSQL, Zod request validation, and CORS middleware.
- **Data Model**: Full parity with existing frontend items, including support for 6 media categories (`movie`, `video`, `article`, `book`, `course`, `audio` with `sourceUrl`), priority levels, normalized 1–5 ratings, and automatic status/progress synchronization.

---

## 📋 Prerequisites

- **Node.js**: `v18+` (Tested on `v24.14.1`)
- **npm**: `v9+`
- **PostgreSQL**: `v14+` (Local instance or Docker container)

---

## ⚙️ Environment Configuration

1. Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:5173"
   DATABASE_URL="postgresql://localhost_user:postgres@127.0.0.1:5433/queueme_db?schema=public"
   ```

---

## 🗄 Database Setup & Migrations

1. **Run Prisma Migrations**:
   Applies database migrations to your PostgreSQL instance:
   ```bash
   npm run prisma:migrate
   ```

2. **Seed Initial Data**:
   Populates the database with the 15 standard sample items (including 3 Audio items):
   ```bash
   npm run prisma:seed
   ```

3. **Prisma Studio (Optional UI)**:
   Inspect your database records in a browser:
   ```bash
   npx prisma studio
   ```

---

## 🚀 Running the Application

### 1. Start Backend API Server
Runs on `http://localhost:5000`:
```bash
# Production start
npm run server

# Development mode with auto-reload
npm run server:dev
```

### 2. Start Frontend Dev Server
Runs on `http://localhost:5173`:
```bash
npm run dev
```

---

## 🧪 Available Checks & Testing

- **Backend API Test Suite** (supertest):
  ```bash
  npm run test:backend
  ```
- **Code Linting** (ESLint):
  ```bash
  npm run lint
  ```
- **Frontend Production Build** (Vite):
  ```bash
  npm run build
  ```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and service uptime |
| `GET` | `/api/items` | List items with filtering, search, and sorting |
| `GET` | `/api/items/:id` | Retrieve single item by ID |
| `POST` | `/api/items` | Create new item with Zod validation |
| `PATCH` | `/api/items/:id` | Update item fields (auto-syncs progress/status) |
| `PUT` | `/api/items/:id` | Update item fields |
| `DELETE` | `/api/items/:id` | Delete item by ID |
| `POST` | `/api/items/reset` | Reset database to initial sample items |

---

### Query Parameters for `GET /api/items`

- `type`: Filter by media type (`all`, `movie`, `video`, `article`, `book`, `course`, `audio`).
- `status`: Filter by status (`all`, `queued`, `in_progress`, `completed`).
- `priority`: Filter by priority (`all`, `high`, `medium`, `low`).
- `search`: Case-insensitive text search matching `title`, `creator`, `platform`, or `tags`. Prefix with `#` (e.g., `?search=%23AI`) to filter strictly by tag.
- `sortBy`: Sorting mode (`recent`, `priority`, `progress`, `title`). Defaults to `recent`.

---

### Item Data Model

```json
{
  "id": "qm-13",
  "title": "Lex Fridman Podcast #419 – Sam Altman",
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
  "tags": ["AI", "Podcasts", "Sam Altman"],
  "coverImage": "https://images.unsplash.com/...",
  "url": "https://www.youtube.com/watch?v=...",
  "sourceUrl": "https://open.spotify.com/episode/...",
  "notes": "Incredible deep dive into GPT-5 capabilities.",
  "addedDate": "2026-10-05",
  "createdAt": "2026-10-18T14:21:22.000Z",
  "updatedAt": "2026-10-18T14:21:22.000Z"
}
```

> **Automatic Status & Progress Rules**:
> - Setting `status: "completed"` automatically sets `progress: 100` and `progressLabel: "Finished"` (unless explicitly specified).
> - Setting `status: "queued"` automatically sets `progress: 0` and `progressLabel: "Not started"`.
> - Ratings are automatically normalized to a `1.0–5.0` scale.
