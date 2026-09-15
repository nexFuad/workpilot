# WorkPilot Frontend

WorkPilot is a responsive HR and employee workspace built with Next.js. The frontend provides separate HR and employee dashboards, connects every operational page to the backend API, and uses database-backed search, filters, pagination, loading skeletons, and status updates.

## User roles

WorkPilot supports two roles:

- **HR** — manages people, attendance, leave, payroll, advances, loans, documents, announcements, tasks, projects, sites, and shifts.
- **Employee** — manages personal attendance and requests, views compensation, completes assigned work, uploads documents, reads announcements, and updates account information.

## HR workspace

- **Dashboard** — live employee, attendance, request, payroll, task, project, and activity summaries
- **Employees** — create, view, edit, activate, suspend, and delete employee or HR accounts
- **Employee form** — basic information, company, employment details, site, shift, salary, login credentials, role, emergency contact, and address
- **Attendance** — daily database records, status/date filters, check-in and check-out photos, site, shift, absence, overtime, fixed-height table, and pagination
- **Leave requests** — server-side search/filter and approve/reject workflow
- **Payroll & salary** — previous-month payroll generation, month selection, salary breakdown, and upcoming-to-paid status updates
- **Salary advances** — search and request approval/rejection
- **Loans** — search, loan details, installments, and approval/rejection
- **Documents** — search and review employee files; approve, reject with a reason, or delete
- **Announcements** — create, edit, delete, activate/deactivate, pin/unpin, search, inspect details, and track read state
- **Assign tasks** — assign work to employees, update status, edit, delete, search, and paginate
- **Assign projects** — assign multiple members and roles, edit, delete, search, inspect details, and paginate
- **Sites and shifts** — create, edit, delete, activate/deactivate, search through the API, and paginate
- **My account** — shared profile editor and secure password change

## Employee workspace

- **Dashboard** — live personal attendance, leave, salary, advance, loan, task, project, document, and announcement summaries
- **Attendance** — photo-assisted check-in/check-out and attendance history
- **Leave** — submit leave requests and follow their status
- **Salary** — view salary breakdown, deductions, bonuses, take-home pay, history, and salary advances
- **Loans** — request a loan and view repayment/installment information
- **My tasks** — search assigned tasks and update their progress
- **Projects** — search assigned projects and view complete project, team-member, and role details
- **Documents** — upload image/PDF documents, search records, and view review status
- **Announcements** — search, open full details, and mark announcements as read per account
- **My account** — update profile photo and personal information, and change password

All monetary values are displayed in dollars.

## UI and data behavior

- Responsive HR and employee layouts with mobile navigation
- Consistent tables, cards, dialogs, dropdowns, action menus, and status controls
- Backend/API-driven search and filtering instead of client-only filtering
- Reusable debounced search behavior and pagination
- Skeleton states while database data is loading
- Fixed-height, scrollable data tables where required
- Toast feedback and confirmation dialogs for mutations
- TanStack Query cache invalidation keeps connected pages synchronized after updates

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- React Hook Form and Zod
- Radix UI primitives
- Lucide icons
- Sonner notifications
- Cloudinary uploads

## Routes

### Public

| Route    | Purpose               |
| -------- | --------------------- |
| `/`      | Landing/entry route   |
| `/login` | HR and employee login |

### HR

| Route                  | Purpose                       |
| ---------------------- | ----------------------------- |
| `/hr`                  | HR dashboard                  |
| `/hr/employees`        | Employee/account directory    |
| `/hr/employees/create` | Create employee or HR account |
| `/hr/employees/[id]`   | View or edit an account       |
| `/hr/attendance`       | Attendance review             |
| `/hr/leave`            | Leave request management      |
| `/hr/payroll`          | Payroll and salary            |
| `/hr/advances`         | Salary advances               |
| `/hr/loans`            | Loans                         |
| `/hr/documents`        | Employee documents            |
| `/hr/announcements`    | Announcements                 |
| `/hr/tasks`            | Assign tasks                  |
| `/hr/projects`         | Assign projects               |
| `/hr/sites`            | Sites                         |
| `/hr/shifts`           | Shifts                        |
| `/hr/account`          | HR account settings           |

### Employee

| Route                     | Purpose                   |
| ------------------------- | ------------------------- |
| `/employee`               | Employee dashboard        |
| `/employee/attendance`    | Attendance                |
| `/employee/leave`         | Leave requests            |
| `/employee/salary`        | Salary and advances       |
| `/employee/loans`         | Loans                     |
| `/employee/tasks`         | Assigned tasks            |
| `/employee/projects`      | Assigned projects         |
| `/employee/documents`     | Documents                 |
| `/employee/announcements` | Announcements             |
| `/employee/account`       | Employee account settings |

## Project structure

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── employee/
│   │   ├── hr/
│   │   └── login/
│   ├── components/
│   │   ├── employee/
│   │   ├── hr/
│   │   ├── shared/
│   │   └── ui/
│   ├── hooks/
│   ├── providers/
│   ├── services/
│   └── types/
├── next.config.ts
└── package.json
```

The shared hooks include authentication, debounced values, API search behavior, and Cloudinary uploads. Domain-specific data logic stays close to its page/component or service.

## Environment variables

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-unsigned-upload-preset"
```

| Variable                               | Required    | Description                              |
| -------------------------------------- | ----------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`                  | Yes         | Backend origin without a trailing `/api` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | For uploads | Cloudinary cloud name                    |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | For uploads | Unsigned Cloudinary upload preset        |

## Local development

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The backend must be running and its `FRONTEND_URL` must match this frontend origin.

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | Start the Next.js development server |
| `pnpm build`        | Create a production build            |
| `pnpm start`        | Start the production server          |
| `pnpm lint`         | Run ESLint                           |
| `pnpm format`       | Format the codebase                  |
| `pnpm format:check` | Check formatting                     |

## Backend communication

- API requests include credentials so the backend can use HTTP-only access and refresh cookies.
- Search, filters, date/month selection, and pagination call backend endpoints.
- TanStack Query refetches or invalidates related data after mutations.
- Protected layouts redirect unauthenticated users and enforce HR/employee role access.

## Deployment on Vercel

1. Import the repository and set the project root to `frontend`.
2. Add the production environment variables.
3. Set `NEXT_PUBLIC_API_URL` to the deployed backend origin.
4. Ensure the backend `FRONTEND_URL` exactly matches the deployed frontend origin.
5. Deploy, then verify login, refresh-token rotation, cross-origin cookies, uploads, and protected routes.

See the repository-level `DEPLOYMENT.md` for the full production checklist.
