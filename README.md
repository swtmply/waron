# Clarity Clinic Workspace

A local-first dental clinic management scaffold built with TanStack Start, React, shadcn/ui, Drizzle, and libSQL (SQLite). The demo includes a shared weekly calendar with a multi-practitioner filter, searchable appointment booking, appointment details and actions, patient records with clinical notes, and a practitioner roster.

## Run locally

```bash
bun install
bun run db:setup
bun run dev
```

Open <http://localhost:3000>. `db:setup` applies the committed Drizzle migration and inserts fictional sample data once. The SQLite file is `data/clinic-demo.db` and is gitignored. Run `bun run db:generate` after editing the schema, then `bun run db:migrate`.

## Database boundary

The tables in `src/db/schema.ts` use a stable `clinic_` prefix. A future tenant has its **own database with this same schema**; table names do not change per tenant. `src/db/client.server.ts` currently reads one `CLINIC_DB_URL` (default: local SQLite) and optional `CLINIC_DB_AUTH_TOKEN`. This connection shape also accepts a Turso/libSQL URL, but tenant resolution, provisioning, authentication, authorization, and database migration orchestration are not yet implemented. Do not expose this app to real patient data until those boundaries exist.

The current server functions validate writes. Appointment booking rejects overlapping scheduled visits for either the practitioner or patient. Clinical notes are linked to a patient and practitioner. The local demo uses fictional records only.

See [CHECKPOINT.md](./CHECKPOINT.md) for the state of this scaffold and the next implementation steps.

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for the Figma-based UI rules, Tailwind
palette, shadcn components, and URL state conventions. Agents should start with
[AGENTS.md](./AGENTS.md).
