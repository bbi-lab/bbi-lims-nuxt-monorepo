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

The production SGE database already has ~190 migrations applied from the old standalone `bbi-lims-sge`
repository. Running the baseline migration against it would fail (tables already exist).

### Option 1 — Run the cutover script (recommended)

`server/db/cutover/prod_migration_to_monorepo.sql` moves the production database to the shape this
package expects (users schema, lookup tables, renamed user FK columns, rebuilt views) and then
registers every migration in `server/db/migrations/` as already applied, without running them.

```bash
psql "$PROD_URL" -f packages/sge-lims-app/server/db/cutover/prod_migration_to_monorepo.sql
```

Read the pre-flight checks in its header first — it assumes the standalone app has applied its
migrations through `0193`, and it aborts if any plate still uses a retired plate type.

This file is the authority on the cutover; it lived in `bbi-lims-sge/scripts/` until 2026-08-10,
where it drifted out of step with the baseline twice (a dropped `status` column and two
mismatched FK constraint names). **Whenever `0000_sge_baseline` or `shared/db/schema/*` changes,
update this script in the same commit.** The stale copy in `bbi-lims-sge/scripts/` should be
deleted there.

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

`0003`–`0010` port the upstream migrations (`0184`–`0193`) that landed in `bbi-lims-sge` after
this package branched off. Production has already had those applied by the standalone app, so the
cutover script registers them rather than running them; a fresh database runs them in order after
the baseline.

## Generating new migrations after changes

```bash
cd packages/sge-lims-app
pnpm exec drizzle-kit generate
```

New migrations are written to `server/db/migrations/` with auto-generated names.
Rename them to a descriptive slug if desired before committing.

Only directories containing a `snapshot.json` are part of drizzle-kit's diff chain, and the
hand-written migrations here deliberately carry no snapshot — so `generate` diffs against the
newest one that does. Keep exactly one authoritative snapshot as the chain's tail (currently
`0010_add_status_to_snv_lib_gibson_products_view/snapshot.json`) and refresh it whenever the TS
schema changes, or `generate` will re-emit DDL that earlier migrations already applied.
