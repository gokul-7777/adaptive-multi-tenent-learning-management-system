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

## Deploying to Vercel

The Vite frontend and Express API can be deployed together as one Vercel project. The API is exposed through `/api/*`; in production, the frontend sends API requests to the same origin.

1. Import this GitHub repository into Vercel and keep the project root as the root directory.
2. Select **Vite** as the framework preset, with `npm run build` as the build command and `dist` as the output directory.
3. Add `MONGODB_URI` in the Vercel project's environment variables. Use a database user with only the permissions the app requires. Never add the real URI to GitHub.
4. Deploy and test the Vercel URL, including an API route such as `/api/health`.

The repository includes `api/index.js` and `vercel.json` to route API requests to the Express application. Local development continues to use the Vite proxy and `npm run server`.

## Demo and production notes

The application includes sample records and demo authentication for development. It is a prototype, not a production-ready student information system. Do not use real student data or deploy it publicly without implementing appropriate authentication, password hashing, authorization, and privacy protections.

## License

No license has been specified. All rights remain with the project author unless a license is added.
