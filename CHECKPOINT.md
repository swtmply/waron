# Resume checkpoint — 2026-09-25

## What works

- TanStack Start route at `/` with Overview, Calendar, Patients, and Practitioners views.
- Local libSQL/SQLite via Drizzle, migration in `drizzle/`, fictional seed data, and `clinic_` table prefix.
- Shared weekly calendar with searchable, multiple practitioner filter. Calendar events and appointment table rows open a dedicated appointment page with patient details, notes, and visit history.
- Create appointments, patients, practitioners, and clinical notes. Booking uses searchable patient/practitioner fields and offers suggested visit reasons while allowing free text.
- Appointment actions can edit the visit, change its status, or delete it after confirmation. Deleting a visit keeps clinical notes on the patient record.
- shadcn Table plus TanStack Table v9 for searchable, sortable, paginated patient and appointment lists.
- Server-side validation and overlap checks for scheduled appointments.

## Start here

1. `bun install`
2. `bun run db:setup`
3. `bun run dev`
4. `bun run typecheck && bun run lint && bun run build`

The active database is `data/clinic-demo.db` by default. It is intentionally ignored by git. The schema is `src/db/schema.ts`; connection is `src/db/client.server.ts`; server actions are `src/lib/clinic.functions.ts`; dashboard is `src/components/clinic-dashboard.tsx`; appointment details route is `src/routes/appointments/$appointmentId.tsx`. After schema changes, run `bun run db:generate` and commit the migration.

## Decisions

- **Practitioner** covers dentists now and other providers later; **patient** remains the care recipient.
- One database per clinic is the intended tenant boundary. Each database uses identical `clinic_` table names. Dynamic tenant-specific table names would duplicate the schema and are unnecessary with separate databases.
- The app currently opens one database URL. Tenant lookup must come from an authenticated session, never an untrusted client-supplied URL or slug.
- The calendar uses native date controls and a simple week grid. Booking times are stored as UTC ISO strings and shown in the browser's local time zone.
- The local seed is fictional and refuses a remote database URL.
- The dashboard keeps section headings brief and uses shadcn Combobox, Dropdown Menu, Dialog, and Table components. No authentication or tenant switching exists yet.

## Next steps before real clinics

1. Add clinic identity, users, roles, authentication, and authorization on every server function. Resolve the clinic's Turso URL/token from trusted server-side identity.
2. Provision a Turso database per clinic, apply all committed migrations to each database, and store database credentials securely outside client code.
3. Make conflict prevention atomic for concurrent bookings. The current overlap check is appropriate for a local scaffold but can race under concurrent writers.
4. Define clinical data requirements with a practicing clinic: charting, treatment plans, consent, attachments, audit trail, retention, backups, and access rules.

No real patient data should be entered into this unauthenticated scaffold.

## Verification on this checkpoint

`bun run typecheck`, `bun run lint`, and `bun run build` pass. In the local browser, appointment rows opened their detail page, the edit action saved, booking created a temporary visit, and the practitioner filter accepted two selections. The temporary visit was removed from the local demo database.
