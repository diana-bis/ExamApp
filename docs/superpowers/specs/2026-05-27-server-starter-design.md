# Server Starter Integration — Design Spec
**Date:** 2026-05-27  
**Branch:** `feature/server-starter`  
**Author:** Diana  

---

## Goal

Connect the existing React/Vite client to a real Express server, while keeping the ability to run in pure client-side mock mode. Switching between mock and server mode requires only a configuration change — no code edits.

---

## Current State

The client already has a fully working dual-mode pattern. All three service classes already contain both mock and fetch paths:

| Service | Location | Mock path | Fetch path |
|---|---|---|---|
| `ExamService` | `client/src/api/examService.js` | ✅ present | ✅ present |
| `SubmissionService` | `client/src/api/SubmissionService.js` | ✅ present | ✅ present |
| `AuthService` | `client/src/services/AuthService.js` | ✅ present | ✅ present |

`ConfigService.isMockMode()` is hardcoded to `true`. `ConfigService.getApiBaseUrl()` returns the relative string `'/api'`. These are the only things blocking server mode from working.

---

## Out of Scope

- Changing any React component
- Database persistence (server data resets on restart)
- Authentication tokens / JWT
- Production deployment

---

## Changes to Existing Files

### `client/src/services/ConfigService.js`

**Change:** Read `VITE_MOCK_MODE` and `VITE_API_BASE_URL` from Vite environment variables instead of returning hardcoded values.

```js
class ConfigService {
    getAppName() {
        return 'E-Test System';
    }

    /*
     * Controls whether the API layer uses the in-memory mockDb or real HTTP calls.
     * true  → mockDb (default — safe if env var is absent).
     * false → real backend mode, uses getApiBaseUrl() for fetch calls.
     * Switch: set VITE_MOCK_MODE=false in client/.env.local and restart Vite.
     */
    isMockMode() {
        return import.meta.env.VITE_MOCK_MODE !== 'false';
    }

    /*
     * Base URL for all API fetch calls (server mode only).
     * Reads VITE_API_BASE_URL from .env.local; defaults to http://localhost:3001/api.
     */
    getApiBaseUrl() {
        return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    }
}

export const configService = new ConfigService();
```

---

## New Files to Create

### `client/.env.local`

Configures the client for local development. This file is gitignored by default in Vite projects.

```env
# Set to false to switch to real server mode
VITE_MOCK_MODE=true

# Base URL for the Express API server
VITE_API_BASE_URL=http://localhost:3001/api
```

To switch to server mode: change `VITE_MOCK_MODE=false` and restart `npm run dev` in the client terminal.

---

### `server/package.json`

```json
{
  "name": "server",
  "version": "1.0.0",
  "description": "ExamApp Express API server",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
```

Uses Node's built-in `--watch` flag (Node 18+) — no nodemon dependency required.

---

### `server/src/index.js`

Single file containing:

1. **In-memory data** — same structure as `client/src/api/mockDb.js`:
   - `users` array (same two seed users: teacher + student)
   - `exams` array (same two seed exams: JavaScript Basics, React Fundamentals)
   - `submissions` array (starts empty)

2. **Express setup:**
   - `cors({ origin: 'http://localhost:5173' })` — allows Vite dev client
   - `express.json()` — parses request bodies
   - Request logger middleware — logs `[SERVER] METHOD /path → STATUS (Xms)` to stdout

3. **Auth routes (`/api/auth`, `/api/users`):**
   - `POST /api/auth/login` — find user by username, compare password, return user (minus password) + mock token
   - `POST /api/auth/register` — check for duplicate username, create user, return new user
   - `GET /api/users` — return all users (minus passwords)

4. **Exam routes (`/api/exams`):**
   - `GET /api/exams` — return all exams
   - `GET /api/exams/:id` — return one exam, 404 if not found
   - `POST /api/exams` — auto-generate `EX` prefixed ID, set status `draft`, push to array
   - `PUT /api/exams/:id` — find and merge update, 404 if not found
   - `DELETE /api/exams/:id` — filter out by id, 404 if not found

5. **Submission routes (`/api/submissions`):**
   - `GET /api/submissions` — return all, or filter by `?examId=` or `?studentId=` query params
   - `POST /api/submissions` — auto-generate `SUB`-prefixed ID, add `submittedAt` timestamp
   - `GET /api/submissions/:id` — return one, 404 if not found
   - `PUT /api/submissions/:id` — merge update, 404 if not found

6. **`app.listen(3001)`** — server starts on port 3001

---

### `.vscode/launch.json`

Three VS Code debug configurations:

1. **Debug Client** — `type: chrome`, URL `http://localhost:5173`. Requires Vite dev server already running in a terminal.

2. **Debug Server** — `type: node`, program `${workspaceFolder}/server/src/index.js`, cwd `${workspaceFolder}/server`. Starts the server with debugger attached.

3. **Debug Both** (compound) — launches "Debug Server" first, then "Debug Client". Both debuggers run simultaneously.

---

## API Endpoint Summary

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with username + password |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/users` | List all users (no passwords) |
| GET | `/api/exams` | List all exams |
| GET | `/api/exams/:id` | Get one exam |
| POST | `/api/exams` | Create exam |
| PUT | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |
| GET | `/api/submissions` | List all (filter by `?examId` or `?studentId`) |
| POST | `/api/submissions` | Submit exam |
| GET | `/api/submissions/:id` | Get one submission |
| PUT | `/api/submissions/:id` | Update submission (grading) |

---

## Terminal Setup

| Terminal | Directory | Command | Port |
|---|---|---|---|
| Client | `client/` | `npm run dev` | 5173 |
| Server | `server/` | `npm run dev` | 3001 |

---

## Implementation Order

1. Update `client/src/services/ConfigService.js`
2. Create `client/.env.local`
3. Create `server/package.json`
4. Install server dependencies (`npm install` in `server/`)
5. Create `server/src/index.js`
6. Create `.vscode/launch.json`
7. Test: start both terminals, flip `VITE_MOCK_MODE=false`, verify requests hit the server

---

## Success Criteria

- `VITE_MOCK_MODE=true` → app works exactly as before, no server needed
- `VITE_MOCK_MODE=false` → all CRUD operations go through `http://localhost:3001/api/*`
- Server logs each request to its terminal
- No React component was changed
- VS Code can debug client and server simultaneously
