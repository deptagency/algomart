# API

The API provides REST endpoints for the Web frontend. These endpoints include: user account and wallet management, creating payments, blockchain abstractions, reading cached CMS data and merging it with user data. Some key tech: Fastify, Postgres, Objection/Knex, Typebox, and Swagger docs.

## Get started

The `api` and `scribe` apps share a database.
Commands (e.g. migrations) to manage the DB live in [Scribe](../scribe/README.md).

### Connect to the CMS

In order for the API to connect to the CMS, the Directus key needs to be inputted into the CMS.
The seed scrip `nx seed cms` handles this automatically. See the [CMS readme](/apps/cms/README.md) for details.

To manually add the CMS token:

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
  modules/ # API service layer (routes, handlers, db interactions)
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

## Circle

### Circle webhooks

Notes for setting up Circle webhooks. If you have questions on this, ping @smonn before attempting it!

> ⚠️ **Failure to complete a step may require you to bug the Circle team to manually remove notification subscriptions.**

1. Make sure you've applied the latest DB migrations and run `npm install`
2. Make sure you have your own [Circle sandbox account](https://my-sandbox.circle.com/signup)!
3. Make sure you have [ngrok](https://ngrok.com/docs/getting-started) running a tunnel for your API (or use [localtunnel](https://www.npmjs.com/package/localtunnel)), ideally with a custom `--subdomain` set (see below for example)
4. Go to the API Swagger docs (e.g. http://localhost:3001/docs)
5. Set the API key as the authorization bearer token via the "Authorize" button
6. Scroll down to and expand the "Admin" section
7. Expand the `POST /admin/webhooks/circle/configure` section
8. Enter the ngrok domain + webhook endpoint as the payload, see below for example
9. Keep an eye on the logs and the DB table `Webhook`. If something does not work, let me know!

Example of running ngrok:

```sh
# ngrok example with subdomain (assuming API runs on port 3001)
ngrok http 3001 --subdomain=your-subdomain

# localtunnel example with subdomain
lt -p 3001 -s your-subdomain
```

Request to API for setting up Circle webhook:

```http
POST /admin/webhooks/circle/configure
Content-Type: application/json
Authorization: Bearer API_KEY

{ "endpoint": "https://your-subdomain.ngrok.io/webhooks/circle" }
```

Run `ngrok config edit` to, surprise, edit your ngrok config:

```yaml
# It's recommended to add this to your ngrok config
# This way you can run `ngrok start api`
tunnels:
  api:
    proto: http
    addr: 3001
    subdomain: your-subdomain
```

### Funding the Circle merchant wallet

TL;DR: You need to add money to circle merchant wallet for card payments to work smoothly

[Card Payments Settlement](https://developers.circle.com/docs/post-payments-processing#card-payments-settlement)
on the sandbox environment take between 5 and 10 minutes.
In the live environment, it can take 3 or 4 business days.
Once settled, USDC is credited to our merchant wallet
and can be transferred to a user's wallet where it can be used to make purchase.
Except, we don't want users to have to wait for settlement to make purchases,
so once a payment is confirmed (in seconds, not minutes or days)
we transfer "house money" to their wallet while we wait for settlement.

If there is no house money, credit card payments still work
but the user will see an error when we try to move house money into their wallet.
Their payment will show as pending until settlement.
Once settled, their payment amount no longer shows as pending,
and they can proceed with their purchase

#### Add house money circle merchant wallet

Log in to the circle sandbox dashboard.
Use the "Transfer from a blockchain wallet" function to generate an Algorand address
Send testnet USDC-A to the address using a [testnet dispenser](https://dispenser.testnet.aws.algodev.network)
