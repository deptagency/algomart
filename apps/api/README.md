# API

The API provides REST endpoints for the Web frontend. These endpoints include: user account and wallet management, creating payments, blockchain abstractions, reading cached CMS data and merging it with user data. Some key tech: Fastify, Postgres, Objection/Knex, Typebox, and Swagger docs.

## Get started

Duplicate `.env.sample` > `.env` in the `api` folder and enter the required environment variables. Make sure you've created a Postgres databases that matches what's set in the `DATABASE_URL` key in your `api/.env` file.

_NOTE_: The `api/.env` and the `scribe/.env` are almost identical and will share most values, the notable exception being the `PORT` value in the API Configuration section. These must run on separate ports.

Per the `.env`, you'll also need to be connected to an Algorand node, whether in development or production.

Note for existing users: migrations have been moved to the Scribe app.

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

- Use the outputted mnemonic as the value for the `FUNDING_MNEMONIC` variable in the `api/.env` and `scribe/.env` files in this project.

Optionally, you can also fund your wallet from here to be able to perform transactions in the app:

- List the accounts that currently exist in your sandbox

```bash
./sandbox goal account list
```

- You should see several accounts, some with _microAlgos_, and the account with the address you created above likely having 0. You can run the following command to fund the account you just created with microAlgos

```bash
./sandbox goal clerk send -a <AMOUNT> -f <FROM_ADDRESS> -t <TO_ADDRESS>

# Note: Something like 1000000 microAlgos as the amount should be more than plenty to cover transactions
```

### Connect to the CMS

In order for the API to connect to the CMS, the Directus key needs to be inputted into the CMS:

1. Go to your profile (the icon at the very bottom left)
2. Scroll all the way down to Token, under Admin Options
3. Paste in the desired API key (has to match `CMS_ACCESS_TOKEN` in apps/api/.env)

### Start

Once everything is configured, you can start everything in development/watch mode:

```bash
nx serve api
```

To build:

```bash
nx build api
```

## Folder structure

```bash
src/ # Main source code
  api/ # Root setup for the api server
  configuration/ # Environment configurations
  contracts/ # Compiled TEAL contracts
  modules/ # API service layer (routes, handlers, db interactions)
  seeds/ # Database seeding scripts
test/ # Test environment configurations
... # various dot files and configuration for the project
```

## General conventions

The server is configured in `./apps/api/src/api/build-app.ts` and bootstrapped in `./apps/api/src/index.ts`. The latter file connects the server to the database and kicks off routine in-memory tasks.

### Public API

Routes are also registered during this configuration stage and requests to those routes are intercepted by the corresponding controllers in the `./apps/api/src/modules` directory. These controllers call services where database interactions take place.

### CMS Cache

In addition to the information stored in the `api` database, the CMS is also leveraged to provide the frontend with pertinent data. The CMS data holds "templates", which are content/imagery oriented representations of an NFT. The `api` layer will fetch these templates from the database and use them to either mint NFTs, or just to associate already-minted NFTs (or packs of NFTs) with the corresponding content.

CMS implementation details can be found in `./libs/shared/adapters/src/lib/cms-cache-adapter.ts`.

### Notifications

Emails are scheduled and dispatched to the appropriate users when certain asynchronous actions occur (e.g. assets are transferred, and auction is won, etc.). These leverage [Sendgrid](https://sendgrid.com/) (see `./libs/shared/adapters/src/lib/mailer-adapter.ts` for more implementation details), but the adapter can be subbed out in favor of another email distributor with minimal effort.

### Tasks

Moved to [Scribe](../scribe/README.md).

## Migrations

Moved to [Scribe](../scribe/README.md).
