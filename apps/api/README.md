# API

This package within the monorepo is the heart of the web application and is responsible for many key pieces of functionality:

- Polling for and generating new blockchain assets
- Orchestrating payments and their statuses
- User wallet management and on-chain asset transferring
- Dispatching email notifications
- Consuming and disseminating CMS data
- Providing a REST API interface for the frontend (`web` package)
- And more!

While the `api` is responsible for many complex operations, its architecture is clean and relatively straightforward. It is built on [Fastify](https://www.fastify.io/), runs on a [Postgres](https://www.postgresql.org/) database using [Objection](https://vincit.github.io/objection.js) as an ORM, leverages [Typebox](https://github.com/sinclairzx81/typebox) for validation and Swagger generation, and runs a number of routine in-memory background tasks using [Toad Scheduler](https://github.com/kibertoad/toad-scheduler) as well as providing API endpoints for the frontend.

## Get started

Install all dependencies from the root of the monorepo:

```bash
npm install
```

In the `api` service, you'll want to ensure that you've configured your `.env` file and set up a database. Make sure you've created a Postgres databases that matches what's set in the `DATABASE_URL` key in your `.env` file.

If you're not using the default `DATABASE_SCHEMA=public` in your `.env` file, then you'll need to make sure to create the schema you choose:

```bash
CREATE SCHEMA <name>
```

Finally, apply migrations:

```bash
npm run db:latest
```

Per the `.env`, you'll also need to be connected to an Algorand node, whether in development or production.

### Creating a local Algorand Sandbox account

For local development, the [Algorand Sandbox](https://github.com/algorand/sandbox) is handy docker instance that makes interfacing with the blockchain simple from your local machine. It will also create an account that can be funded with fake Algos using the [Testnet Dispenser](https://dispenser.testnet.aws.algodev.network/).

To create an account:

- Download the [Algorand Sandbox](https://github.com/algorand/sandbox) and start up the docker instance:

```bash
./sandbox up
```

- Then create an account:

```bash
./sandbox goal account new
```

- This will output `Created new account with address <ADDRESS>`
- Take that `<ADDRESS>` and input

```bash
./sandbox goal account export -a <ADDRESS>
```

- Use the outputted mnemonic within the `.env` file within this project.

Once everything is configured, you can start everything in development/watch mode:

```bash
npm run dev
```

To build:

```bash
npm run build
```

## Folder structure

```bash
locales/ # Interpolated i18n translation files used for email notifications
  [locale]/ # e.g. en-US
    emails.json # Grouping of translatable JSON
scripts/ # Utilities (e.g. create algorand account)
src/ # Main source code
  api/ # Root setup for the api server
  configuration/ # Environment configurations
  lib/ # Third-party service adapters
  migrations/ # Database migrations
  models/ # Knex database entity models
  modules/ # API service layer (routes, handlers, db interactions)
  plugins/ # Helpful api plugins
  seeds/ # Database seeding scripts
  shared/ # Shared service utilties
  tasks/ # Routine in-memory task configurations
  utils/ # Handy utilities used throughout app
test/ # Test environment configurations
... # various dot files and configuration for the project
```

## General conventions

The server is configured in `./packages/api/src/api/build-app.ts` and bootstrapped in `./packages/api/src/index.ts`. The latter file connects the server to the database and kicks off routine in-memory tasks.

### Public API

Routes are also registered during this configuration stage and requests to those routes are intercepted by the corresponding controllers in the `./packages/api/src/modules` directory. These controllers call services where database interactions take place.

### CMS

In addition to the information stored in the `api` database, the CMS is also leveraged to provide the frontend with pertinent data. The CMS data holds "templates", which are content/imagery oriented representations of an NFT. The `api` layer will fetch these templates from the database and use them to either mint NFTs, or just to associate already-minted NFTs (or packs of NFTs) with the corresponding content.

CMS implementation details can be found in `./packages/api/src/lib/directus-adapter.ts`.

### Notifications

Emails are scheduled and dispatched to the appropriate users when certain asynchronous actions occur (e.g. assets are transferred, and auction is won, etc.). These leverage [Sendgrid](https://sendgrid.com/) (see `./packages/api/src/lib/sendgrid-adapter.ts` for more implementation details), but the adapter can be subbed out in favor of another email distributor with minimal effort.

### Tasks

[Toad Scheduler](https://github.com/kibertoad/toad-scheduler) is used to run routine in-memory tasks at set intervals. A list of scheduled tasks can be found in `./packages/api/src/tasks/index.ts`.

## Migrations

Any updates to database models should be accompanied by a database migrations (see existing migrations in `./packages/api/src/migrations` for inspiration). Each migration must include a downward migration in case a rollback is needed. Additionally, the `package.json` contains other migration scripts (up, down, rollback, and latest) in case they're needed.
