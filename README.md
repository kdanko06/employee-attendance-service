# employee-attendance-service

Employer attendance backend built with Next.js API routes and a JSON-file data store that follows a hexagonal (ports & adapters) architecture. Admins manage employees and shifts, while employees authenticate and log attendance.

## Features
- JWT authentication with role-based guards (admin vs employee)
- Employee shift lifecycle (sign-in/out) with validation
- Admin CRUD for employers and shift management
- File-backed repositories with mutex protection; data path configurable via `DATA_FILE_PATH`
- Lightweight queue implemented on top of the same JSON store so audit events can be processed asynchronously
- Dockerfile + compose stack mirroring two ECS Fargate tasks (`api` + `worker-logs`) that share a persistent volume

## Getting Started
1. `cp .env.example .env`
2. `npm ci && npm run seed`
3. `docker compose up --build`
4. Use Postman (or similar) to log in with the seeded admin (`admin@example.com` / `Admin123!`), manage employers, and test attendance endpoints.

> **Data storage**: By default the service writes to `./data/store.json`. In AWS, mount an EFS volume (or other persistent storage) into both the `api` and `worker-logs` tasks and point `DATA_FILE_PATH` at the shared file (e.g. `/mnt/data/store.json`).

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
5. Actions enqueue audit events onto a file-based queue; the `worker-logs` consumer removes jobs from the shared JSON file and persists them to the audit log collection.
6. Deploy the `api` and `worker-logs` containers independently (mirrors two ECS services) while pointing both tasks at the same JSON data file through shared storage.
