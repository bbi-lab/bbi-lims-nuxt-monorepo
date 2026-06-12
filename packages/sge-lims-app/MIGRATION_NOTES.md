# SGE LIMS — Database Migration Notes

## Fresh databases (new deployments)

Run migrations normally:

```bash
cd packages/sge-lims-app
pnpm drizzle-kit migrate
```

This applies `server/db/migrations/0000_sge_baseline/migration.sql` which creates all tables,
enums, indexes, views, and the `users` schema from scratch.

## Existing SGE production databases

The production SGE database already has ~180 migrations applied from the old standalone `bbi-lims-sge`
repository. Running the baseline migration against it would fail (tables already exist).

### Option 1 — Mark baseline as already applied (recommended)

After deploying the new app, tell Drizzle the baseline is already applied without re-running it:

```sql
-- Run once on the existing production database
INSERT INTO drizzle_migrations (hash, created_at)
VALUES ('0000_sge_baseline', extract(epoch from now())::bigint * 1000);
```

Drizzle will then only run new migrations created after the migration to this monorepo.

### Option 2 — Push schema changes only

Use `drizzle-kit push` to diff and apply only what changed between the old schema and the new:

```bash
# Requires NUXT_DB_* env vars pointing to the production DB
cd packages/sge-lims-app
pnpm drizzle-kit push
```

Review the printed diff carefully before confirming. This is destructive if any column renames
are misinterpreted as drop+create.

## Schema consolidation from old repo

The old `bbi-lims-sge` repository used 180 incremental migrations built up over time.
This monorepo replaces all of them with a single baseline snapshot (`0000_sge_baseline`).
The final schema state is identical — no data migrations are required.

## Generating new migrations after changes

```bash
cd packages/sge-lims-app
pnpm drizzle-kit generate
```

New migrations are written to `server/db/migrations/` with auto-generated names.
Rename them to a descriptive slug if desired before committing.
