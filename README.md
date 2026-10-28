# Adaptive Multi-Tenant Learning Management System

A React-based academic management and learning portal prototype with a Node.js/Express API and optional MongoDB persistence.

## Features

- Role-based admin, faculty, and student dashboards
- Student records, attendance, marks, reports, and course certificates
- Course materials, assessments, learning paths, and results
- Sample data and demo accounts for local exploration

## Technology

- React 19, TypeScript, and Vite 8
- Tailwind CSS 4
- Node.js, Express, and Mongoose
- MongoDB (optional for running with local demo data)

## Requirements

- Node.js 22
- npm
- MongoDB connection string for persistent database storage

## Getting started

1. Install dependencies:

   ```sh
   npm ci
   ```

2. To enable MongoDB persistence, copy `.env.example` to `.env` and set `MONGODB_URI` to your own MongoDB connection string. `MONGODB_DIRECT_URI` is optional and is used only if SRV DNS lookup fails.

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   `.env` is ignored by Git. Never commit database credentials.

3. Start the app:

   ```sh
   npm run dev
   ```

   Vite starts the frontend on port 5173 and automatically starts the API server on port 5000. If MongoDB is not configured or available, the API reports the connection issue and continues in its demo fallback mode.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server and API |
| `npm run server` | Start the API server only |
| `npm run build` | Create the production frontend build in `dist/` |
| `npm run preview` | Preview the production frontend build |
| `npm run format` | Format project files with oxfmt |

## Demo and production notes

The application includes sample records and demo authentication for development. It is a prototype, not a production-ready student information system. Do not use real student data or deploy it publicly without implementing appropriate authentication, password hashing, authorization, and privacy protections.

## License

No license has been specified. All rights remain with the project author unless a license is added.
