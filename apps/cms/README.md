# CMS

This package within the monorepo is a minimal (but powerful) headless CMS using [Directus](https://docs.directus.io/getting-started/introduction/).

The purpose of the CMS is to provide content authors the ability to create and manage application-related "templates" (content, imagery, translations, and other attributes) that can be consumed by the `api` package (to mint and transfer the appropriate assets on the blockchain) and the `web` package (to display the content and imagery in the browser).

## Get started

Use `./.env` and `../../.env` to configure this app,

To (drop and re-)create a Postgres database with the name specified in the `DB_CONNECTION_STRING` in the `.env` file, run:

```bash
nx drop cms
```

To [either install the database (if it's empty) or migrate it to the latest version](https://docs.directus.io/reference/cli/#bootstrap-a-project), run:

```bash
nx bootstrap cms
```

To [update your data model with the latest changes](https://docs.directus.io/reference/cli/#applying-a-snapshot), run:

```bash
nx import cms
```

Start the server locally (**Note:** if your database is empty, you will be prompted to seed the database with configuration values and dummy content)

```bash
nx serve cms
```

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` env var values to log in.

If when prompted, you declined to seed your database, you can kick off the seed script manually (**Note:** the server must be running to seed)

```bash
nx seed cms
```

Once the database is set up, it can be run in conjunction with the other monorepo packages from the root of the repository.

## Make files publicly viewable

`nx seed cms` does this automatically
If you do not seed, then when you first spin up the app, you'll see only text rendered in place of images. There's an extra step needed in order to make these files available.

1. Navigate to the local CMS, which defaults to http://localhost:8055
1. Log in using the username and password you specified.
1. In the local CMS, go to Settings (the cog wheel)
1. Go to Roles & Permissions
1. Click on the Public category
1. At the bottom of the table, click on System Collections, which will expand the table
1. Navigate to Directus Files
1. Click on the second icon (the Read column), which will open a dropdown
1. Select All Access

Then go back and refresh, and you should see images!

## Configure Webhook for Scribe

Running the seed should do this for you, but otherwise the steps are:

1. Navigate to the CMS and login
1. Go to Settings > Webhooks
1. Click on Create Webhook (the round plus button)
1. Enter Scribe Webhook details and click save.

| Field           | Value                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Name            | `Scribe` (or any name you prefer)                                                                                               |
| Method          | `POST`                                                                                                                          |
| URL             | `SCRIBE_URL` + `/webhooks/directus`                                                                                             |
| Status          | `Active`                                                                                                                        |
| Data            | Check `Send Event Data`                                                                                                         |
| Request Headers | Empty                                                                                                                           |
| Triggers        | Check `Create`, `Update`, `Delete`                                                                                              |
| Collections     | Check `Application`, `Collections`, `Countries`, `Homepage`, `Languages`, `NFT Templates`, `Pack Templates`, `Rarities`, `Sets` |

## Data Model Overview

Once bootstrapped, the Directus CMS will be populated with configurable entities (Directus refers to these as "collections"). There are a handful of these collections that can be administered to create and configure NFTs. Here is an explanation of each collection:

### Countries

The Countries collection is for setting the countries which can be supported within the application when going through the payment flow. First set the countries, providing a country code as well as translations for the country name. In order to have these supported within the application, you'll also need to select these for the Application (see next section on the Application collection). Circle documentation on supported countries for payments can be found [here](https://developers.circle.com/docs/supported-countries).

### Application

The Application collection is for setting the application's countries which are supported in the payment flow. Select the countries that will be supported.

### Languages

The entire platform supports multiple languages based on an end-user's locale. You can support as many languages as you like and provide the appropriate translations wherever readable content is edited. For each supported language, provide its name and its [ISO language code](http://www.lingoes.net/en/translator/langcode.htm).

### Rarities

If you want NFTs to have different rarities, these can be configured under the Rarities collection. These different types of rarities can be assigned to NFT templates (more on this below). Provide a unique numeric code, the name of the rarity (e.g. "Rare", "Epic", etc.) that you want to associate with the collectible, and a color for the rarity. The name and the color can be shown by the UI.

### NFT Templates

NFT templates represent an NFT that will be minted by the API. Note that once an NFT Template record is published, many of its fields cannot be edited. This is to maintain integrity of the asset. An NFT Template has a number of configurable fields:

- Status: Set to "Published" once you are sure all other fields have been configured in a satisfactory manner. Otherwise, keep it as a "Draft".
- Total Editions: The number of instances of this NFT that should be minted.
- Unique Code: A unique identifier that will appear on the blockchain transaction. Note, due to blockchain constraints, this field is limited to 8 bytes. Therefore, it should be kept to 8 or less alpha-numeric characters.
- Preview Image: A preview image of the NFT collectible that can be shown in the UI.
- Preview Video: A preview video of the NFT collectible that can be embedded in the UI.
- Preview Audio: A preview audio file of the NFT collectible that can be embedded in the UI.
- Asset File: If applicable, the actual file of the NFT. For example, this could be a higher-resolution version of the Preview Image.
- Pack Template: The Pack that this NFT should belong to. More on Pack Templates below.
- Rarity: If desired, assign a rarity to the NFT. See previous section for more details.
- Set: If desired, the Set that this NFT should belong to. More on Sets below.
- Collection: If desired, the Collection that this NFT should belong to. More on Collections below.
- Title: The title of the NFT to display when viewing the NFT in the UI.
- Subtitle: If desired, a subtitle to display when viewing the NFT in the UI.
- Description: A more in-depth description to display when viewing the NFT in the UI.

### Pack Templates

A Pack Templates is what an end-user acquires. If you want to distribute a single NFT, a single NFT can be added to a Pack Template. Otherwise, a Pack Template is also able to contain multiple NFTs.

Note that once a Pack Template record is published, many of its fields cannot be edited. This is to maintain integrity of the storefront.A Pack Template has a number of configurable fields:

- Status: Set to "Published" once you are sure all other fields have been configured in a satisfactory manner. Otherwise, keep it as a "Draft".
- Slug: A URL-safe slug that can be referenced in the UI.
- Released At: The date at which a Pack can be viewed or acquired.
- Price: The price of the Pack.
- Type: There are four different types of Packs:
  - Free: The Pack can be be claimed for free by any registered end-user.
  - Redeem: When a redeemable Pack is generated, the API will generate a unique redeemable code. These codes can be manually distributed to end-users and they can then redeem the corresponding Pack with the unique redemption code.
  - Purchase: The Pack can be purchased at the price specified in the "Price" field.
  - Auction: The Pack can be auctioned for a period of time in which end-users can place bids. The length of the auction is determined by the window of time between the "Released At" date and the "Auction Until" date. If a value is provided in the "Price", it will act as a reserve price. In other words, if the bids don't exceed this value, no bidders will win the auction.
- NFT Order: The order in which NFTs are minted as Packs are being built. This can be sequential ("Match") or randomized ("Random").
- NFT Distribution: Specify the distribution of NFTs within a Pack. One of each NFT can be generated ("One of each") per Pack, or they can be randomized ("Random, no duplicates"). In the latter scenario, the Pack generation will attempt to mix-and-match the distribution of NFTs within a Pack with full randomness without adding duplicate NFTs to a given Pack.
- NFTs Per Pack: The number of NFTs contained in a single Pack.
- Auction Until: If the "Type" field is set to "Auction", this will be the closing date of the Pack's auction.
- Pack Image: A preview/cover image to represent the Pack to be shown in the UI.
- Title: The title of the Pack to display when viewing the Pack in the UI.
- Subtitle: If desired, a subtitle to display when viewing the Pack in the UI.
- Description: A more in-depth description to display when viewing the Pack in the UI.
- NFT Templates: The NFTs that belong in this Pack.
- Additional Images: If you would like to show additional images (e.g. in media gallery) when a Pack is shown in the UI, they can be provided here.
- Allow Bid Expiration: If the "Type" field is set to "Auction", setting this to option will award the auction to the next highest bidder if the original winning bidder doesn't complete the auction payment within a given timeframe. This will continually cascade down the highest bidders until there are no bidders left. It will only cascade down to unique bidders (in other words, subsequent bidders will not be awarded the auction if they've already neglected to pay a higher bid).
- One Pack Per Customer: Setting this option to true will allow a user to only acquire one version of the Pack.

## Sets

Sets are an optional mechanism to group NFTs in a way that can incentivize an end-user to collect an NFT from each template assigned to a Set. For example, let's imagine we are distributing playing card NFTs. A Set might be all of the NFTs for a suit (hearts, spades, clubs or diamonds).

Note that once Set record is published, many of its fields cannot be edited. This is to maintain integrity of the acquisition incentive. A Set has a number of configurable fields:

- Status: Set to "Published" once you are sure all other fields have been configured in a satisfactory manner. Otherwise, keep it as a "Draft".
- Slug: A URL-safe slug that can be referenced in the UI.
- Collection: The Collection this Set belongs to. More on Collections below.
- NFT Templates: The NFTs that belong in this Set.
- Name: The name of the Set to display when viewing the Set in the UI.

## Collections

Not to be confused with Directus' "Collection" nomenclature. Within this platform, Collections are an optional mechanism to group Sets and/or individual NFTs in a way that can incentivize an end-user to collect all of the NFTs assigned to a Collection, or all of the NFTs in the Sets assigned to the Collection. For example, let's revisit the playing card NFTs scenario described above. A Collection might represent all of the suits in a deck. Each Set (again, representing a suit), would contain NFTs for each card of a given suit. So in essence, a user who has collected all NFTs in every Set of a Collection has effectively collected every NFT for each card of each suit.

Collections don't have to contain Sets. They can also just contain individual NFTs. They also contain Sets AND individual NFTs.

Note that once Set record is published, many of its fields cannot be edited. This is to maintain integrity of the acquisition incentive.

- Status: Set to "Published" once you are sure all other fields have been configured in a satisfactory manner. Otherwise, keep it as a "Draft".
- Slug: A URL-safe slug that can be referenced in the UI.
- Collection Image: A preview/cover image to represent the Collection to be shown in the UI.
- Name: The name of the Collection to display when viewing the NFT in the UI.
- Description: A more in-depth description to display when viewing the Collection in the UI.
- Metadata: If desirable, you can add a custom JSON object here for consumption via the front end. This could be something like the example JSON snippet below.
- Reward Prompt: If you like to incentivize NFT acquisition for a given Collection, you can add details here.
- Reward Complete: If a "Reward Prompt" is provided, these are the details that will display when a user completes the prompt (collects all NFTs in a Collection).
- Reward Image: If a "Reward Prompt" is provided, provide a preview/cover image to display in the UI.
- Sets: The Sets of NFTs that belong in this Collection.
- NFT Templates: The NFTs that belong in this Set.

Example of "Metadata" field value:

```json
{
  "size": {
    "name": "Size",
    "value": "18,240 SQFT"
  },
  "location": {
    "name": "Location",
    "value": "Vancouver"
  }
}
```

## Homepage

The homepage of the provided UI depicts a featured Pack, which takes prominence at the top of the page, followed by a grid of other packs, then followed by a number of notable collectibles. This is purely aesthetic to create an interest homepage when an end-user visits the storefront. Depending on the needs of your UI, this can be omitted, extended, or just used as is.

## KYC Management

When customer verification is attempted and the account ends up in Manual Review, it will be listed in the CMS for review. The compliance team can view the records in the CMS for accounts in Manual Review, navigate to the Onfido dashboard to review more applicant details, and update the status for the account within the CMS.

Every 15 minutes accounts with a Manual Review status are retrieved from the API database and upserted into the CMS. Currently the records will persist in the database after they are updated with a new status.

Selecting a row in the KYC Management table will take you to an individual page for the account where the status can be updated. Click the "Onfido" button to access the applicant record; you must be signed in or it will redirect you to the main Dashboard after authentication.

The API database account record is immediately updated after the verification status changes in the CMS. There will be no indication of this change in Onfido at this time, so the Onfido applicant record will remain in the status determined from the initial verification workflow.

## Updating the data model

To update the data model you can start by locally using the Directus UI. But to ensure other developers can apply those changes you will need to export the data model to a snapshot file.

`nx export cms` - This exports the CMS data model to `snapshot.yml`
`nx import cms` - This imports from `snapshot.yml` to your CMS

## Bulk CMS Importing

Mass ingestion of CMS data can be achieved via CSV files. An example `.csv` file for each importable entiy can be found within `apps/cms/scripts/seed-data/sample-data/`:

- `rarities-sample.csv`
- `collections-sample.csv`
- `sets-sample.csv`
- `pack-templates-sample.csv`
- `nft-templates-sample.csv`
- `nft_update_single_asset.csv`
- `nft_update_test_errors.csv`
- `nft_update_test.csv`

NOTE: Due to the nature of CMS entity relationships, the following constraints apply:

- Collections must be imported before Sets.
- Sets must be imported before NFT Templates.
- Pack Templates must be imported before NFT Templates.
- Rarities must be imported before NFT templates.

Therefore, the following order of import is recommended:

1. Rarities
2. Collections
3. Sets
4. Pack Templates
5. NFT Templates

Be sure to make note of the mappings for each entity in the provided examples:

- Sets reference a Collection via its slug.
- NFT templates reference:
  - A Pack Template via its slug
  - A Rarity via its code
  - A Set OR a Collection via their slugs

The CSV for each entity contains rows that map to that entity's fields. For file uploads, the value should be a publicly-accessible URL so that it can be imported into the CMS's uploads.

To run imports:

```bash
cd apps/cms
```

Then run one or more of the following scripts in the following order (see note below):

```bash
npm run import rarities ./scripts/seed-data/rarities-sample.csv
npm run import collections ./scripts/seed-data/collections-sample.csv
npm run import sets ./scripts/seed-data/sets-sample.csv
npm run import pack_templates ./scripts/seed-data/pack-templates-sample.csv
npm run import nft_templates ./scripts/seed-data/nft-templates-sample.csv
```

Upon each CSV import, an output CSV is also exported which will also include errors should any occur (this will most likely be the result of a missing required field, unmatched relationship, or a constraint violation). **It is recommended to test your imports on an empty database as a dry run before importing into a live database, as the results cannot be undone.**

## Directus Extensions

There are several extensions scaffolded on top of the default Directus installation. [Directus extension documentation.](https://docs.directus.io/extensions/introduction/)

### Creating a New Extension

Copying an existing extension of the same type is a good way to create a new extension. For example, if I need to create a new hook type extension, I would want to copy an existing hook.

- In the extensions/hooks directory copy the directory of an existing hook
- In the copy's package.json change the 'name' to match your directory name. If you create a directory extensions/hooks/validate-data then you want the package.json 'name to be

  `"name": "directus-extension-validate-data"`

- In the apps/cms/package.json add an entry to the scripts section for this new extension

  `"build-validate-data": "cd extensions/hooks/validate-data && npx directus-extension build"`

- Edit the extensions/hooks/[new extension name]/src/index.js as needed
- In order to test your changes you need to build it first. Directus expects a built version of the extension at the root of the extension's directory (so at extensions/hooks/[new extension name]). You can build two different ways to accomplish this.
  - at apps/cms, run: `npm run build-[new extension name]`
  - at the hook's location, extensions/hooks/[new extension name], run: `npm run build`
- You can add `EXTENSIONS_AUTO_RELOAD=true` to your apps/cms/.env file to have Directus automatically reload newly built extensions. This way you don't have to restart your cms every time you build.
- When you commit be sure to commit:
  - the extension's src content
  - the built index.js file that is generated from the build
  - the package.json
- Add a blurb below describing your new extension

Similarly, if you are creating the first of an extension type (like endpoint or module), you can copy another type of extension and place it in the appropriate extension type directory. In additiona to the steps above you would need to change the type in the package.json to match the extension type you are creating:

```
"directus:extension": {
  "type": "hook",
  "path": "index.js",
  "source": "src/index.js",
  "host": "9.14.1"
},
```

### Updating an existing extension

When updating an existing extension:

- You can add `EXTENSIONS_AUTO_RELOAD=true` to your apps/cms/.env file to have Directus automatically reload newly built extensions. This way you don't have to restart your cms every time you build.
- In order to test your changes you need rebuild the extension. Directus expects a built version of the extension at the root of the extension (so at extensions/hooks/[new extension name]). You can build two different ways to accomplish this.
  - at apps/cms, run: `npm run build-[new extension name]`
  - at the hook's location, extensions/hooks/[new extension name], run: `npm run build`
- When you commit be sure to commit:
  - the extension's src content
  - the built index.js file that is generated from the build
  - the package.json

### Existing Extensions

#### extensions/displays/pack-price

This extensions is choosable as a display handler and supports formatting a value stored as an integer in the U.S. currency format.

- A value stored as 1200 will display as 12.00
- A value stored as 1210 will display as 12.10

#### extensions/hooks/interfaces/price-conversion

This extension is choosable as an interface handler and handles keeping the price value, for example in pack templates, consistent. The price field is stored as an Integer. Some examples:

- A value of 12 will be stored as 1200 and the interface displays 12.00
- A value of 12.1 will be stored as 1210 and the interface displays 12.10

#### extensions/hooks/import-data

This is a hook extension and fires when an item in the import_files collection is created or updated. It support processing uploaded CSV files for rarities, collections, sets, pack templates, and NFT templates.

#### extensions/hooks/kyc-management

This is a scheduled hook extension and fires periodically as defined in the extension itself. This hook makes a call to the api to obtain users with a particular KYC status.

#### extensions/hooks/set-verification-status

This is a hook extension and fires when an item in the kyc_management collection is updated. If needed it makes a call out to the api to update the user's kyc verification status.

Another function of this hook is as a request filter that fires before a kyc_management collection update occurs. This is a validation mechanism to prevent user's from batch-updating kyc verification statuses. Filter hooks have the ability to halt actions.

#### extensions/hooks/start-up-hook

This is a hook extension and fires once after cms application start up. The purpose is to seed the default admin user account token for cms access.
