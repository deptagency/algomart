# Web

This package within the Lerna monorepo is a [Next.js](https://nextjs.org/)-based frontend containing a foundational UI that can be further customized or even swapped out entirely in favor of another frontend implementation.

Key technologies used:

- [Next.js](https://nextjs.org/) - SSR React framework
- [Next Translate](https://github.com/vinissimus/next-translate) - For internationalization and localization
- [KY](https://github.com/sindresorhus/ky) - For interacting with the `api` package
- [SWR](https://swr.vercel.app/) - For lazy data fetching
- [TailwindCSS](https://tailwindcss.com/) - For styling
- [Dinero.js](https://dinerojs.com/) - For working with currencies
- [Firebase](https://firebase.google.com/) - For authentication
- [Validator-fns](https://www.npmjs.com/package/validator-fns) - For client-side validation
- [THREE.js](https://threejs.org/) - For Pack opening experience

## Get started

Since the frontend relies heavily on the other packages within the monorepo, it is recommended to run the project in tandem with the packages it depends upon. Install all dependencies from the root of the monorepo:

```bash
npm install
```

Once everything is configured, you can start everything in development/watch mode:

```bash
npm run dev
```

To build _everything_:

```bash
npm run build
```

## Folder structure

```bash
cypress/ # Cypress (visual) test files
locales/ # Interpolated i18n translation files
  [locale]/ # e.g. en-us
    [namespace].json # Grouping of translatable JSON
public/ # Client-side assets
scripts/ # Client-side assets
src/ # Main source code
  clients/ # Third-party API clients
  components/ # Basic building blocks
  config/ # Third-party configuration (e.g Firebase)
  contexts/ # React Context components and hooks
  layouts/ # Components for various page layouts
  middleware/ # API route middlewares
  pages/ # Next.js page components, combines layouts and templates
  services/ # Services and helpers to interact with APIs
  templates/ # Page templates, uses components
  types/ # TypeScript interfaces and enums specific to web package
  utils/ # Small utility functions and helpers
  environment.ts # Environment variable management utility
... # various dot files and configuration for the project
```

## General workflow

The `web` package relies heavily on the `api` package, which in conjunction with the `cms` package, orchestrates the handling of data and content. For this reason, the `web` package doesn't need its own database, but it does rely on Next.js's internal mechanisms (such as its request/response api handlers (see `./packages/web/src/pages/api/*`) as well as its `getServerSideProps`) to make `GET` and `POST` requests to the `api`.

### The API Client

The API Client (see `./packages/web/src/clients/api-client.ts` is the class that makes handshakes with the `api` package and it can be accessed from within the web app's backend service layer (see `./packages/web/src/services`) or from its api layer (see: `./packages/web/src/pages/api/*`).

These two backend layers can be called directly from the browser and act as a proxy between the frontend and the `api` package.

### User Management

[Firebase](https://firebase.google.com/) is leveraged as a simple authentication mechanism (as well as the storage of registered user avatars). You can see the implementation details in `./packages/web/src/contexts/auth-context.tsx`.

The Firebase footprint within the `web` package is small and isolated, so it can be replaced with another authentication solution with minimal effort if need be.

Firebase provides a unique identifier (the `uid`) when a user is registered for the first time. We refer to this identifier as the `externalId` within the database. In the interest of maintaining a separation of concerns between the `api` package and the frontend's authentication solution, this `externalId` is the only Firebase-related piece of information stored in the database. It can be used to match a user session with their actual account in the `api`.

For security/[KYC](https://en.wikipedia.org/wiki/Know_your_customer) purposes, the front end requires a user has either authenticated via Google, or in the case of a user who has registered via email, that the the email address is verified. For email users, this verification email is automatically sent upon registration and can be dispatched again at a user's request from their profile page.

### TailwindCSS conventions

[TailwindCSS](https://tailwindcss.com/) allows for convenient style decoration within JSX in a `classname` prop, but the use of CSS modules using the `@apply` pattern for more comprehensively styled components and templates is recommended for organizational purposes. See existing implementations for inspiration.

Recommended VS Code extensions:

- https://marketplace.visualstudio.com/items?itemName=heybourn.headwind (class name sorter)
- https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss (intellisense)
- https://marketplace.visualstudio.com/items?itemName=austenc.tailwind-docs (doc links)
- https://marketplace.visualstudio.com/items?itemName=macieklad.tailwind-sass-syntax (sass support)

### i18n conventions

Locale-based translations are handled with `next-translate`, a handy Next.js utility package that is configured in `./i18n.js`. When the app is bootstrapped, Next will load load the translations from `./locales/[locale]/[...namespaces].json` based on that configuration. Until more languages are introduced (and there are mechanisms to support this), `en-us` will be the default locale.

Namespaces are simply JSON files, but rather than have all translations live in one file, the concept of a namespace allows us to methodically organize our translations. For example, common items used on every page (e.g. button text, statuses, etc.) can live in a `common.json` namespace while more page-specific stuff can live in its own namespace.

Refer to the [next-translate](https://github.com/vinissimus/next-translate) documentation for more details, but as a TLDR, the primary mechanism that can be used to interface with a translation:

```jsx
import useTranslation from 'next-translate/useTranslation'
// ...
const { t } = useTranslation()
// ...
<h1>{t('[namespace]:[value]', {something: 123})}</h1>
```

Where:

- `namespace` represents the `namespace.json` file (case-sensitive)
- `value` represents the json value
- `something` represents a dynamic variable
- `123` represents a dynamic variable value

For example, if we had `forms.json` that looked like:

```json
{
  "errors": {
    "minCharacters": "Must be at least {{count}} characters"
  }
}
```

Our JSX would look like:

```jsx
<span>{t('forms:errors.minCharacters', { count: 8 })}</span>
```

Which would output:

```html
<span>Must be at least 8 characters</span>
```

One other translation mechanism to be aware of is the [Trans component](https://github.com/vinissimus/next-translate#trans-component). Oftentimes, it is not needed, but it can be useful in a scenario where additional HTML needs to be interpolated.

Additional translation conventions:

- Consider and prefer a more abstract approach (where possible) to avoid many namespaces and duplicative translation keys.
- If the string is short and static (e.g. "Click Here"), make the key and the value the same (`"Click Here": "Click Here"`). This makes reading the JS less ambiguous as the translation text is verbatim.
- If the string is long and/or dynamic, use camelcase naming (`"descriptionText": "..."`)
- If a JSON object has a deliberate order (e.g. nav items), order them accordingly, otherwise order them alphabetically. This makes the translation files easier for team members to parse.
