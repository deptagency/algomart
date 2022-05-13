# Scribe

Scribe runs various background tasks and syncs data from the CMS into read-only tables in the API database.

## Get started

Make sure you configure the webhook according to the steps in the [CMS readme](../cms/README.md).

Duplicate `.env.sample` > `.env` in the `scribe` folder and enter the required environment variables. Make sure you've created a Postgres databases that matches what's set in the `DATABASE_URL` key in your `api/.env` file.

_NOTE_: The `scribe/.env` and the `api/.env` are almost identical and will share most values, the notable exception being the `PORT` value in the # API Configuration. These must run on separate ports.

If you're not using the default `DATABASE_SCHEMA=public` in your `.env` file, then you'll need to make sure to create the schema you choose:

```bash
CREATE SCHEMA <name>
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

To reset the database, run:

```bash
nx drop scribe
nx run scribe:migrate:latest
```

## Folder structure

```bash
scripts/ # Utility scripts
src/ # Main source code
  configuration/ # Environment configurations
  languages/ # Translations
  migrations/ # Database migrations
  modules/ # API service layer (routes, handlers, db interactions)
  tasks/ # Various background task runners
... # various dot files and configuration for the project
```

### Tasks

[Toad Scheduler](https://github.com/kibertoad/toad-scheduler) is used to run routine in-memory tasks at set intervals. A list of scheduled tasks can be found in `./packages/api/src/tasks/index.ts`.

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
