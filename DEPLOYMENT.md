# WorkPilot deployment checklist

## Vercel backend

1. Import the repository as a separate Vercel project.
2. Set its root directory to `backend`.
3. Keep the Hono framework preset selected. The committed `backend/vercel.json` also declares it.
4. Do not set an output directory or start command. Vercel detects the default Hono export in `src/index.ts`.
5. Add these variables from `backend/.env.example`:
   - `DATABASE_URL`; use a serverless-compatible pooled PostgreSQL URL
   - `DIRECT_URL` for Prisma migrations when the main URL uses a connection pooler
   - `AUTH_JWT_SECRET` with at least 32 random characters
   - `FRONTEND_URL` with the final frontend Vercel origin
   - `NODE_ENV=production`
6. Apply pending migrations against the production database before deploying a release:

   ```bash
   pnpm prisma:migrate
   ```

Vercel Functions do not use the Railway start command, so they do not automatically execute the migration command.

## Railway backend alternative

1. Create the Railway service from this repository.
2. Set the service root directory to `/backend`.
3. Set the config file path to `/backend/railway.json` if Railway does not detect it automatically.
4. Add these variables from `backend/.env.example`:
   - `DATABASE_URL`
   - `DIRECT_URL` when the main database URL uses a connection pooler
   - `AUTH_JWT_SECRET` with at least 32 random characters
   - `FRONTEND_URL` with the final Vercel origin, for example `https://workpilot.vercel.app`
   - `NODE_ENV=production`
5. Railway provides `PORT`; do not hard-code it in the dashboard.

The committed Railway start command applies pending Prisma migrations before starting the API. The health-check endpoint is `/api/health`.

## Vercel frontend

1. Import the same repository and set the project root directory to `frontend`.
2. Keep the detected Next.js framework preset and `pnpm build` build command.
3. Add these variables from `frontend/.env.example` to Production and Preview as needed:
   - `NEXT_PUBLIC_API_URL` with the backend Vercel public HTTPS origin
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
4. Redeploy whenever a `NEXT_PUBLIC_*` value changes because Next.js embeds it at build time.

## Authentication and CORS

- `FRONTEND_URL` must be the exact frontend origin. Do not include a route such as `/login`.
- The backend only permits that production origin and sends credentialed CORS headers.
- Authentication uses secure HTTP-only cookies. For the most reliable browser support, use sibling custom domains such as `app.example.com` and `api.example.com`; otherwise some strict third-party-cookie settings can block cookies between separate deployment domains.
- A Vercel preview URL is a different origin. It needs its own allowed backend environment or a stable preview alias if authenticated preview testing is required.
