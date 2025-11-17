# employee-attendance-service

Employer attendance backend built with Next.js API routes and a JSON-file data store that follows a hexagonal (ports & adapters) architecture. Admins manage employees and shifts, while employees authenticate and log attendance.

## Features
- JWT authentication with role-based guards (admin vs employee)
- Employee shift lifecycle (sign-in/out) with validation
- Admin CRUD for employers and shift management
- File-backed repositories with mutex protection; data path configurable via `DATA_FILE_PATH`
- Direct audit logging into the same JSON datastore (no external queue/worker needed)
- Dockerfile + compose stack for a single container (`api`) that exposes port 3000

## Getting Started
1. `cp .env.example .env`
2. `npm ci && npm run seed`
3. `docker compose up --build`
4. Use Postman (or similar) to log in with the seeded admin (`admin@example.com` / `Admin123!`) or sample worker (`worker@example.com` / `Worker123!`), manage employers, and test attendance endpoints (the worker already has an open shift plus one completed shift).

> **Data storage**: By default the service writes to `./data/store.json`. In AWS, mount an EFS volume (or other persistent storage) into the container and point `DATA_FILE_PATH` at the shared file (e.g. `/mnt/data/store.json`).

## API Overview
- `POST /api/auth/login` – authenticate employer, receive JWT
- `POST /api/attendance/sign-in` – employee starts a shift
- `POST /api/attendance/sign-off` – employee ends current shift
- `GET/POST /api/employers` – admin list and create employees
- `GET/PATCH/DELETE /api/employers/[id]` – admin manage specific employee
- `GET /api/employers/me` – authenticated profile
- `GET /api/attendance/shifts` – admin view shifts
- `PATCH/DELETE /api/attendance/shifts/[id]` – admin adjust or delete shift
- `POST /api/auth/logout` & `POST /api/auth/refresh` – stubs for session lifecycle

## How It Works
1. Users authenticate and receive a JWT containing `{ sub, role }`.
2. Clients send the token via `Authorization: Bearer <token>` for every protected request.
3. Route guards (`requireAuth`, `requireAdmin`) validate identity and role before invoking domain use cases.
4. Core business logic lives in domain use cases, using JSON-backed adapters via ports.
5. Each use case records audit events directly via the audit-log repository (no separate worker/queue).
6. Deploy a single container (via Docker Compose, ECS, etc.) that mounts persistent storage for `DATA_FILE_PATH`.
