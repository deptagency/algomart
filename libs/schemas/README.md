# Schemas

This package within the Lerna monorepo is used as a centralized place for JSON schemas (using [Typebox](https://github.com/sinclairzx81/typebox)) as well as TypeScript interfaces and enums.

The JSON schemas are used primarily in the `api` package of this monorepo in conjunction with Fastify for request validations and Swagger generation.

The TypeScript interfaces and enums are used throughout both the `api` and `web` packages of this monorepo.

## Get started

Install all dependencies from the root of the monorepo:

```bash
npm install
```

You can start everything in development/watch mode by running the following command from the root of the monorepo (which will run the entire project) or the root of the package (`./packages/schemas`):

```bash
npm run dev
```

To build _everything_:

```bash
npm run build
```

## Conventions

Any sort of schema, interface, or enum that might be used throughout the application should exist in this package to enforce consistency between packages. The `src` folder is organized logically based on the API's database model and there is also `./src/shared` file containing common reusable patterns.

To get a feel for how schemas are constructed, check the existing implementations and consult the [Typebox](https://github.com/sinclairzx81/typebox) documentation.

## Usage

Within the `api` and `web` packages of this monorepo, schemas can be accessed via the following import pattern:

```ts
import { ExternalId /* other imports */ } from '@algomart/schemas'
```
