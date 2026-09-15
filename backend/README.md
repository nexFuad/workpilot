# WorkPilot API

WorkPilot API is the backend for a two-role HR and employee management platform. It provides authentication, employee administration, attendance, leave, payroll, salary advance, loan, document, announcement, task, project, site, shift, profile, and dashboard APIs backed by PostgreSQL.

## Main features

### Authentication and authorization

- HR and employee roles
- Employee ID/email and password login
- Short-lived access tokens and rotating refresh-token sessions
- HTTP-only authentication cookies
- Optional **Remember me** session: 30 days when enabled, 1 day otherwise
- Profile retrieval and update, profile-photo URL storage, and password change
- Role-based protection for HR-only operations

### Employee operations

- Live dashboard summaries from the database
- Attendance check-in and check-out with photo URLs
- Leave request creation and history
- Salary history, deductions, allowances, bonuses, and take-home summaries
- Salary advance requests
- Loan requests, installments, and repayment history
- Assigned task listing, search, and status updates
- Assigned project listing, search, member roles, and project details
- Document upload metadata, search, review status, and history
- Announcement listing, search, details, and per-user read status

### HR operations

- Live HR dashboard metrics and recent activity
- Employee and HR account creation, viewing, editing, activation, suspension, and deletion
- Salary, role, employment, company, site, shift, and emergency-contact management
- Daily attendance review with check-in/check-out photos, site, shift, absence, and overtime
- Leave request approval and rejection
- Previous-month payroll generation and paid-status management
- Salary advance and loan review
- Employee-document approval, rejection with reason, and deletion
- Announcement creation, editing, deletion, activation, pinning, search, and read analytics
- Task and project assignment to employees
- Site and shift CRUD, status management, API search, and pagination

## Technology

- Node.js 22
- TypeScript
- [Hono](https://hono.dev/)
- PostgreSQL
- Prisma ORM
- Zod validation
- JOSE/JWT authentication
- bcrypt password hashing

## Project structure

```text
backend/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   ├── shared/
│   ├── app.ts
│   ├── index.ts          # Vercel serverless entry
│   └── node-server.ts    # Standalone Node entry
├── railway.json
├── vercel.json
└── package.json
```

Each domain module keeps its route, controller, service, schema, and supporting types together.

## API groups

| Base path                         | Purpose                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| `/api/auth`                       | Login, refresh, logout, current user, profile, and password |
| `/api/attendance`                 | Employee attendance                                         |
| `/api/leaves`                     | Employee leave requests                                     |
| `/api/compensation`               | Employee salary, advances, and loans                        |
| `/api/tasks`                      | Employee tasks                                              |
| `/api/projects`                   | Employee projects                                           |
| `/api/documents`                  | Employee documents                                          |
| `/api/announcements`              | Employee announcements and read state                       |
| `/api/dashboard`                  | Employee dashboard                                          |
| `/api/hr/attendance`              | HR attendance management                                    |
| `/api/hr/leaves`                  | HR leave management                                         |
| `/api/hr/payroll`                 | Payroll generation and status                               |
| `/api/hr/advances`                | Salary advance management                                   |
| `/api/hr/loans`                   | Loan management                                             |
| `/api/hr/announcements`           | Announcement management                                     |
| `/api/hr/tasks`                   | Task assignment                                             |
| `/api/hr/projects`                | Project assignment                                          |
| `/api/hr/employees`               | Employee and HR account management                          |
| `/api/hr/sites`, `/api/hr/shifts` | Site and shift management                                   |

## Environment variables

Create a `.env` file in `backend/`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
AUTH_JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
PORT="4000"
```

| Variable          | Required             | Description                                          |
| ----------------- | -------------------- | ---------------------------------------------------- |
| `DATABASE_URL`    | Yes                  | Pooled PostgreSQL connection used by the app         |
| `DIRECT_URL`      | Production databases | Direct database connection used by Prisma migrations |
| `AUTH_JWT_SECRET` | Yes                  | JWT signing secret; minimum 32 characters            |
| `FRONTEND_URL`    | Yes                  | Exact frontend origin allowed by production CORS     |
| `NODE_ENV`        | Yes in production    | Use `production` for secure production cookies       |
| `PORT`            | No                   | Standalone server port; defaults to `4000`           |

Do not commit real secrets.

## Local development

Requirements: Node.js 22+, pnpm, and PostgreSQL.

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed
pnpm dev
```

The standalone API runs at `http://localhost:4000`.

## Scripts

| Command                   | Description                               |
| ------------------------- | ----------------------------------------- |
| `pnpm dev`                | Start the TypeScript server in watch mode |
| `pnpm build`              | Compile TypeScript to `dist/`             |
| `pnpm start`              | Start the compiled standalone server      |
| `pnpm prisma:generate`    | Generate Prisma Client                    |
| `pnpm prisma:migrate:dev` | Run development migrations                |
| `pnpm prisma:migrate`     | Apply committed migrations in production  |
| `pnpm prisma:seed`        | Seed the database                         |
| `pnpm format`             | Format source files                       |
| `pnpm format:check`       | Check formatting                          |

## Authentication lifecycle

1. Login validates credentials and creates a database-backed session.
2. The API returns access and refresh tokens in HTTP-only cookies.
3. The frontend refreshes an expired access token through the refresh endpoint.
4. Refresh-token rotation invalidates the previous refresh token.
5. Logout revokes the session and clears both cookies.

Production cookies use `Secure`, `SameSite=None`, and partitioning for a frontend and API deployed on different HTTPS domains.

## Deployment

### Vercel

1. Import the repository and set the project root to `backend`.
2. Add all required environment variables.
3. Deploy using the included `vercel.json`; `src/index.ts` exports the Hono app for Vercel.
4. Run `pnpm prisma:migrate` against the production database separately when migrations change.
5. Set `FRONTEND_URL` to the exact deployed frontend origin.

### Standalone Node or Railway

The standalone runtime uses `src/node-server.ts`. Build with `pnpm build` and start with `pnpm start`. The included `railway.json` contains the Railway configuration.

See the repository-level `DEPLOYMENT.md` for the complete frontend/backend deployment checklist.
