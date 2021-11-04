# AlgoMart

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)][code of conduct]

This project is developed to be a foundational starter for creating your own NFT storefront on the Algorand blockchain. It is a monorepo that includes a Fastify API, a headless CMS (Directus), a front-end sample implementation (NextJS), and a shared schemas package to share Typescript interfaces and enums across the monorepo.

## 📚 General Project Overview

The main purpose of this platform is twofold; to make it easy for developers to spin up a custom storefront that interfaces with the blockchain, and to make that storefront accessible to the storefront administrators and its end-users who might not be familiar with the technical nuances of blockchain technology.

In order to accomplish this, storefront administrators should be able to easily to create, configure, and mint NFTs. Likewise, end-users should be able to redeem, purchase, or bid on them without concern of what's happening behind the scenes on the blockchain.

### Backend Overview

To accomplish these challenges, **templates** are used within the CMS.

NFT Templates represent an NFT that will be minted (any number of specified times). It includes key information such as title, description, rarity, and other important configurable metadata that will be consumed by the API.

NFT Templates are grouped within Pack Templates. Packs can contain one or more NFT Templates and also have a number of configurable settings. Most notably, they can be set to be purchasable, to be auctioned, to be claimed via an auto-generated redemption code, or to be given away free. For a full overview of the CMS model, see the [CMS README](apps/cms/README.md).

Meanwhile, the API continually polls the CMS for new NFT Templates and Pack Templates. So once the templates are configured in the CMS, the API will find them, mint the NFTs, and then group them into Packs based on the Pack template's configuration.

From here on out, the NFT and Pack information can be accessed from the API and displayed to an end-user, who can then purchase, bid on, redeem, or freely claim the Pack (based on the corresponding Pack template's configuration).

### Frontend Overview

The backend API can be accessed via REST endpoints by a frontend. This frontend can be custom-built, or the included NextJS web project can be used and further customized.

When an end-user registers through the site, a user account record is created via the API and a new Algorand wallet is generated on their behalf. That wallet's mnemonic key is encrypted via a secret PIN code the end-user provides upon sign-up.

An authenticated end-user can then engage in user flows that allow them to acquire Packs (again, containing one or more minted NFTs). In the case of a monetary transaction, an end-user can enter their credit card information. Upon submission, this information will be validated and processed via Circle's Payments API. Upon a valid confirmation, the API then transfers the assets to the user's wallet.

## 🚧 Pre-release

This software is in a pre-release state. This means while we strive to keep it stable and include database migrations, sometimes we may introduce breaking changes or an accidental bug. Follow our [issue tracker][issue tracker] for more details on what's coming next.

## ✅ Requirements

- Node.js v16, npm v7 (manage version via [nvm][nvm])
- PostgreSQL ([Postgres.app][postgres app] is recommended on macOS, or run via `docker-compose up db`)
- Algod (Algorand node, use [algorand/sandbox][algorand sandbox] to start)
- [Circle][circle] account for taking payments
- [SendGrid][sendgrid] for sending email notifications
- [Firebase][firebase] account for authentication.
- (optional) [Google Cloud Platform][gcp] account for hosting

## 🚀 Get Started

Create an `.env` file in the `./services/api`, `./apps/cms`, and `./apps/web` and populate them with the appropriate environment variables. You can reference the adjacent `.env.example` file in each directory. See the corresponding comments for explanations of each variable.

After this, you can either build and run each application manually or you can use `docker-compose`.

### Running manually

Install all dependencies (may take a while the first time):

```bash
npm install
```

Additional setup may be required within each package. Check the README in each for more details. Once everything is configured, you can start everything in development/watch mode:

```bash
npm run dev
```

To build _everything_:

```bash
npm run build
```

To run all tests:

```
npm test
```

To remove all `node_modules`:

```
npm run clean
```

### Running with docker-compose

The `docker-compose` [configuration](./docker-compose.yml) includes service definitions for the API service,
the CMS & Web applications, and a PostgreSQL 13 database.

After creating the relevant `.env` files above, simply run all services via:

```bash
$ docker-compose up
```

This will load the various `.env` files for Algorand, Circle, etc. credentials -
most other environment variables will be overridden in favor of those specified
in the `docker-compose.yml` file.

Next, the CMS key needs to be added to the admin user created by Directus.
Otherwise, the API cannot authenticate even though its CMS key matches.

- Visit http://localhost:3001
- Authenticate with the CMS [admin email & password](docker-compose.yml#L77)
- Go to the [user directory](http://localhost:3001/admin/users)
- Click the admin user and enter the [CMS key](docker-compose.yml#L70) into the "Token" field
- Click the green check mark in the upper right corner

This allows all API background tasks to run properly.

## 📦 Project packages

When creating a new package, first determine which kind of package you are creating. If it doesn't fit any of the listed ones, discuss with your development team first to decide where it belongs or if a new one is warranted.

### `apps/*`

Applications with a UI.

- [`cms`][cms] - Self-hosted [Directus][directus] headless CMS
- [`web`][web] - Next.js customer-facing website

### `packages/*`

Shared packages used by this monorepo.

- [`schemas`][schemas] - Shared code and typings

### `services/*`

Background tasks and APIs without a UI.

- [`api`][api] - API abstracting communications with Algod etc

## 📖 Quick Workspace Guide

```bash
# example: add typescript as a dev dependency to the web package
npm install --workspace @algomart/web typescript --save-exact

# do a clean install of all dependencies
npm run clean && npm install

# run test script in api package and pass --watch
npm run test:api -- --watch
```

[algorand sandbox]: https://github.com/algorand/sandbox
[api]: services/api
[circle]: https://www.circle.com
[cms]: apps/cms
[code of conduct]: code_of_conduct.md
[directus]: https://directus.io
[firebase]: https://firebase.google.com/
[gcp]: https://cloud.google.com
[issue tracker]: https://github.com/rocketinsights/algorand-marketplace/issues
[nvm]: https://github.com/nvm-sh/nvm
[postgres app]: https://postgresapp.com
[schemas]: packages/schemas
[sendgrid]: https://sendgrid.com
[web]: apps/web
