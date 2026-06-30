# Backend - Run & Development Guide

This backend is a FastAPI REST API backed by PostgreSQL.

## Prerequisites

- Python 3.11+
- PostgreSQL 12+
- A PostgreSQL database/user matching `backend/database/README.md`

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `backend/.env` so `DATABASE_URL` matches your local PostgreSQL database.

## Database

Use the database guide in `backend/database/README.md` to create the database and load the schema.

For FastAPI development, the app can also create SQLAlchemy-managed tables on startup. The SQL files are still useful for the full documented schema, views, functions, triggers, and sample queries.

## Run

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- API health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`
- API base: `http://localhost:8000/api/v1`

## Current API Areas

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- Users, drivers, vehicles, parking zones, parking spaces, logs, infringements, alerts, notifications

## Frontend Integration Notes

The React app currently uses mock authentication. The first practical integration step is to replace `frontend/src/context/AuthContext.jsx` with real calls to:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/register`

The Vite dev server proxies `/api/v1` to `http://localhost:8000`, so local frontend code can call `/api/v1/...`.
