<p align="center"><img alt="AlgoMart Logo" src="./AlgoMart-Logo.png" width="400" height="140"></p>

# AlgoMart

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)][code of conduct]

This project is developed to be a foundational starter for creating your own NFT storefront on the Algorand blockchain. It is a monorepo that includes:

- A [headless CMS](./apps/cms) (Directus)
- A [back-end API](./apps/api) (Fastify)
- A [front-end](./apps/web) sample implementation (NextJS)
- Shared Typescript [interfaces and enums](./libs/schemas)
- [Terraform templates](./terraform) for setting up infrastructure on Google Cloud Platform
- [Github Workflows](./.github/workflows) for linting, type-checking, building, dockerizing, and deploying

## 📚 General Project Overview

The main purpose of this platform is twofold; to make it easy for developers to spin up a custom storefront that interfaces with the blockchain, and to make that storefront accessible to the storefront administrators and its end-users who might not be familiar with the technical nuances of blockchain technology.

In order to accomplish this, storefront administrators should be able to easily to create, configure, and mint NFTs. Likewise, end-users should be able to redeem, purchase, or bid on them without concern of what's happening behind the scenes on the blockchain.

### Backend Overview

To accomplish these challenges, **templates** are used within the CMS.

NFT Templates represent an NFT that will be minted (any number of specified times). It includes key information such as title, description, rarity, and other important configurable metadata that will be consumed by the API.

NFT Templates are grouped within Pack Templates. Packs can contain one or more NFT Templates and also have a number of configurable settings. Most notably, they can be set to be purchasable, to be auctioned, to be claimed via an auto-generated redemption code, or to be given away free. For a full overview of the CMS model, see the [CMS README](apps/cms/README.md).

Meanwhile, the API continually polls the CMS for new NFT Templates and Pack Templates. So once the templates are configured in the CMS, the API will find them, generate the NFT instances in the API's database, and then group them into Packs based on the Pack template's configuration.

From here on out, the NFT and Pack information can be accessed from the API and displayed to an end-user, who can then purchase, bid on, redeem, or freely claim the Pack (based on the corresponding Pack template's configuration).

### Frontend Overview

The backend API can be accessed via REST endpoints by a frontend. This frontend can be custom-built, or the included NextJS web project can be used and further customized.

When an end-user registers through the site, a user account record is created via the API and a new Algorand wallet is generated on their behalf. That wallet's mnemonic key is encrypted via a secret PIN code the end-user provides upon sign-up.

An authenticated end-user can then engage in user flows that allow them to acquire Packs (again, containing one or more to-be-minted NFTs). In the case of a monetary transaction, an end-user can enter their credit card information. Upon submission, this information will be validated and processed via Circle's Payments API. Upon a valid confirmation, the API then mints and transfers the assets to the user's wallet.

## 🚧 Pre-release

This software is in a pre-release state. This means while we strive to keep it stable and include database migrations, sometimes we may introduce breaking changes or an accidental bug. Follow our [issue tracker][issue tracker] for more details on what's coming next.

## ✅ Requirements

- Node.js v16.10 or greater (lts is v16.13.1 as of Jan 2022 and works well), npm v7 or greater (manage version via [nvm][nvm])
- PostgreSQL ([Postgres.app][postgres app] is recommended on macOS, or run via `docker-compose up db`)
- Algod (Algorand node, use [algorand/sandbox][algorand sandbox] to start)
- [Circle][circle] account for taking payments
- [SendGrid][sendgrid] for sending email notifications
- [Firebase][firebase] account for authentication
- [Pinata][pinata] account for storing NFTs
- (optional) [Google Cloud Platform][gcp] account for hosting
- (optional) Install the [Nx CLI][nx cli] for ease of development: `npm i -g nx`

## 🚀 Get Started

You can either build and run each application manually or you can use `docker-compose`.

### Manual Setup

1. Install all dependencies (may take a while the first time):

   ```bash
   npm install
   ```

   1. **For M1 Mac Users:** You might need to manually install additional system dependencies using [Homebrew](https://brew.sh/) before running `npm install`. Once Homebrew is installed, run

      ```bash
      brew install pkg-config cairo pango libpng jpeg giflib librsvg
      ```

2. [Set up the CMS](apps/cms/README.md#Get-started)

3. [Set up the API](apps/api/README.md#Get-started)

4. [Set up the web app](apps/web/README.md#Get-started)

### Running

```bash
npm start
```

To build _everything_:

```bash
npm run build
```

To run all tests:

```
npm test
```

To run eslint for all projects:

```
npm run lint
```

To initialize the databases:

```bash
nx drop api &&\
nx run api:migrate:latest &&\
nx drop cms &&\
nx bootstrap cms &&\
nx import cms
```

### Running with docker-compose

Alternative to running the services manually, they can also be run via Docker. After creating the relevant `.env` files above, add a file called `.babelrc` to the root of the web project (`apps/web/`) and populate it with:

```json
{ "presets": ["next/babel"] }
```

Then run all services:,

```bash
$ docker-compose up
```

Note that page loads in the web app will be slower and tests will fail while this `.babelrc` is present (it is `.gitignore`'d by default). This known issue is an unfortunate incompatibility between Docker and Next's SWC integration at the time of this writing.

## ⚙️ Project dependencies

When updating dependencies, there are a few things that must be kept in mind.

### Directus

If doing any updates to the Directus version, the version numbers must match across the application and the snapshot.yml file must be created with the updated version

1. Update versions
   1. Pin `directus` and `@directus/sdk` versions in `package.json`
   1. Pin `host` version in `/apps/cms/extensions/displays/pack-price/package.json`
   1. Pin `host` version in `/apps/cms/extensions/interfaces/price-conversion/package.json`
   1. Set npm install step of `/docker/deploy/cms/Dockerfile` to version
1. Run `npm install` from root to generate latest `package-lock.json`
1. Run `nx export cms` to generate latest `snapshot.yml`
1. Rebuild cms extensions
   1. Run `nx build-price-display cms` to generate latest js file
   1. Run `nx build-price-interface cms` to generate latest js file

## 📦 Project packages

When creating a new package, first determine which kind of package you are creating. If it doesn't fit any of the listed ones, discuss with your development team first to decide where it belongs or if a new one is warranted.

### `apps/*`

Each app has it's own configuration

- [`cms`][cms] - Self-hosted [Directus][directus] headless CMS
- [`web`][web] - Next.js customer-facing website
- [`api`][api] - API abstracting communications with Algod etc

### `libs/*`

For performance and code organization reasons, the [https://nx.dev/structure/applications-and-libraries](Nx docs) recommend
putting as much functionality as possible into libs, even if the code is only used in a single app. In Nx, a lib is more than just a directory under the `libs/` directory. Each lib must have an entry in the workspace.json file for the lib to build and import correctly.

Linting will fail for any lib code that tries to import code from an app. This means that lib code should never access things like
global configuration variables or environment variables. (eg. `Configuration`) Rather, lib code should receive any environment configuration via
arguments that are passed in.

If you wanted to create a new library at the path `libs/shared/utils`, you'd use the nx generator...
`nx generate @nrwl/node:lib utils --directory shared`

- [`shared`][shared] - code and typings
- `api` - Shared code and typings
- `scribe` - Shared code and typings
- [`schemas`][schemas] - object schemas (todo: should this be moved into `libs/shared`?)

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
[api]: apps/api
[circle]: https://www.circle.com
[cms]: apps/cms
[code of conduct]: CODE_OF_CONDUCT.md
[directus]: https://directus.io
[firebase]: https://firebase.google.com/
[gcp]: https://cloud.google.com
[issue tracker]: https://github.com/deptagency/algomart/issues
[nvm]: https://github.com/nvm-sh/nvm
[postgres app]: https://postgresapp.com
[schemas]: libs/schemas
[sendgrid]: https://sendgrid.com
[web]: apps/web
[nx cli]: https://nx.dev/using-nx/nx-cli#nx-cli
[pinata]: https://www.pinata.cloud/

## 🚢 Deployment

Please see the detailed
[step-by-step guide](./docs/deploy/README.md)
for instructions on how to use the included Terraform templates
and Github Workflow to create a complete storefront environment
on Google Cloud Platform.
