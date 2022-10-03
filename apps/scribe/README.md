# Scribe

Scribe runs various background jobs and syncs data from the CMS into read-only tables in the API database.

## Get started

Make sure you configure the webhook according to the steps in the [CMS readme](../cms/README.md).

Ensure the `.env` file is configured. Use the `.env.example` as a base.

To (drop and re-)create the database, run:

```bash
nx drop scribe
```

Apply all DB migrations:

```bash
nx run scribe:migrate:latest
```

Start via:

```bash
nx serve scribe
```

Build via:

```bash
nx build scribe
```

## Folder structure

```bash
scripts/ # Utility scripts
src/ # Main source code
  configuration/ # Environment configurations
  languages/ # Translations
  migrations/ # Database migrations
  modules/ # API service layer (routes, handlers, db interactions)
  # tasks/ has been moved to `libs/shared/queues`
... # various dot files and configuration for the project
```

## Migrations

Any updates to database models should be accompanied by a database migrations (see existing migrations in `./apps/scribe/src/migrations` for inspiration). Each migration must include a downward migration in case a rollback is needed.

Each of the following is mapped to the corresponding Knex migration command:

```bash
nx run scribe:migrate:up
nx run scribe:migrate:down
nx run scribe:migrate:latest
nx run scribe:migrate:rollback
nx run scribe:migrate:status
nx run scribe:migrate:list
nx run scribe:migrate:currentVersion
nx run scribe:migrate:make --args="--name=NewMigrationName"
```
