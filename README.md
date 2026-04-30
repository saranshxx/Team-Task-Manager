# Team Task Manager

Full-stack team task manager with role-based access (Admin/Member), projects, tasks, and progress tracking.

## Features

- Signup / Login with JWT authentication
- Admin and member role-based access
- Project creation and team assignment
- Task creation, assignment, status updates, and overdue tracking
- REST API backend with SQLite database
- React frontend built with Vite

## Setup

### Root install (recommended)

1. `npm install`
2. `cd backend`
3. Create `.env` from `.env.example`
4. `cd ../frontend`
5. Create `.env` from `.env.example`

### Backend

1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Running Locally

Both servers should now be running:

- Backend: http://localhost:4000
- Frontend: http://localhost:5173

The app uses SQLite for local development (no PostgreSQL setup required).

## Deployment

For production deployment on Railway, switch back to PostgreSQL:

1. Change `backend/package.json` to use `pg` instead of `sqlite3`
2. Update `backend/src/db.js` to use PostgreSQL connection
3. Update all route files to use PostgreSQL syntax
4. Set `DATABASE_URL` and `JWT_SECRET` in Railway environment variables

The root `Procfile` starts the backend with `cd backend && npm start`.
