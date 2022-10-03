# Getting Started with Cypress

## Set up the environment variables

In `apps/web-e2e/`, create a new file named `cypress.env.json` based off of the the existing `cypress.env.json.example`. Some of the values are shared with .env files in the app.

- `BASE_URL`
  - The base URL of the running app to test. Defaults to `http://localhost:3000`
- `FIREBASE_SERVICE_ACCOUNT`
  - Can use same value as in `/apps/web/.env` (keep as valid JSON)
- `FIREBASE_OPTIONS`
  - Can use same value as in `/apps/web/.env` (keep as valid JSON)
- `API_URL`
  - Should match the environment variables of the same names from `/apps/web/.env` if testing locally
- `TEST_PACK_SLUG`
  - The slug of the pack you want to purchase as part of the `critical-flow` test. It is recommended to create a pack specifically for this purpose. The default value is `e2e-pack`.
- `TEST_NFT_SLUG`
  - The slug of the NFT you want to purchase on the secondary marketplace as part of the `situational-flow` test. It is recommended to create an NFT specifically for this purpose. The default value is `e2easset`.
- `BETA_ACCESS_CODE`
  - The code required by the beta access prompt
- `EMAIL`
  - The email to be used when creating / cleaning up a test user. A second version adding `+2` to the email is created in the `situational-flow` test in order to create a second account to purchase a pack on the market
- `PASSWORD`
  - The password to be used when creating / cleaning up a test user
- `USERNAME`
  - The username to be used when creating / cleaning up a test user. A second version in the format of <USERNAME>2 is created in the `situational-flow` test in order to create a second account to purchase a pack on the market

## Prepare data in the CMS

- Create a new NFT template with a lot (maybe 100) of editions.
- Create a new Pack Template potining to the template above with:
  - slug = `TEST_PACK_SLUG` value from above
  - type = Purchase
  - Nfts per pack = 1

## Run the test suite

If you've configured the environment to test against a local instance, make sure that app is up and running.

From the root of the project:

```
npm run test:cypress:open  # run interactive
npm run test:cypress:run   # run headless
```

**or** from the `apps/web-e2e` directory:

```
npx cypress open  # run interactive
npx cypress run   # run headless
```

## Cypress UI

- When you run the `cypress open` command, it will open the Cypress UI app allowing you to choose between `E2E Testing` and `Component Testing` - choose `E2E Testing`.
- On the next screen you can choose which browser to run the tests in - Chrome being the default
- Once you select a browser, a testing instance of that browser will open up and display the list of tests. Clicking on a given test will open a new view with the steps the test is taking to the left, and the view of the app in each state to the right.
