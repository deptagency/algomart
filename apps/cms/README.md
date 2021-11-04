# CMS

This package within the monorepo is a minimal (but powerful) headless CMS using [Directus](https://docs.directus.io/getting-started/introduction/).

The purpose of the CMS is to provide content authors the ability to create and manage application-related "templates" (content, imagery, translations, and other attributes) that can be consumed by the `api` package (to mint and transfer the appropriate assets on the blockchain) and the `web` package (to display the content and imagery in the browser).

## Initial setup

Once the environment variables have been added to the `.env` file, you'll want to create a new Postgres database with the name specified in the `DB_CONNECTION_STRING` in the `.env` file.

Then you'll want to create an admin user, which will allow you to login and administer the CMS:

```bash
cp config.example.json config.local.json
```

Create a username and password, then set up the database and run migrations:

```bash
npm run bootstrap
```

Start the server locally:

```bash
npm run dev
```

Optionally, you can seed the database (while the server is running) to generate dummy content:

```bash
npm run db:seed
```

Once the database is set up, it can be run in conjunction with the other monorepo packages from the root of the repository.

## Manual configuration

After bootstrapping and running the seed script locally, there's additional configuration steps which may be needed.

### 1. Make files publicly viewable

When you first spin up the app, you'll see only text rendered in place of images. There's an extra step needed in order to make these files available.

1. Navigate to the local CMS, which defaults to http://localhost:8055
1. Log in using the username and password you specified in `config.local.json`.
1. In the local CMS, go to Settings (the cog wheel)
1. Go to Roles & Permissions
1. Click on the Public category
1. At the bottom of the table, click on System Collections, which will expand the table
1. Navigate to Directus Files
1. Click on the second icon (the Read column), which will open a dropdown
1. Select All Access

Then go back and refresh, and you should see images!

### 2. Add token for user

In order for the API to connect to the CMS, the Directus key needs to be inputted into the CMS:

1. Go to your profile (the icon at the very bottom left)
1. Scroll all the way down to Token, under Admin Options
1. Paste in the desired API key (has to match `CMS_ACCESS_TOKEN` in services/api/.env)

## Data Model Overview

Once bootstrapped, the Directus CMS will be populated with configurable entities (Directus refers to these as "collections"). There are a handful of these collections that can be administered to create and configure NFTs. Here is an explanation of each collection:

### Application

The Application collection is really just one setting for the app's currency. Set this to the currency your app will be selling in (e.g. `USD`).

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

Sets are an optional mechanism to group NFTs in a way that can incentivize an end-user to collect all of the NFTs assigned to a a Set. For example, let's imagine we are distributing football card NFTs. A Set might be all of the NFTs for a player on a given team in the 2022 season.

Note that once Set record is published, many of its fields cannot be edited. This is to maintain integrity of the acquisition incentive. A Set has a number of configurable fields:

- Status: Set to "Published" once you are sure all other fields have been configured in a satisfactory manner. Otherwise, keep it as a "Draft".
- Slug: A URL-safe slug that can be referenced in the UI.
- Collection: If desired, the Collection that this Set should belong to. More on Collections below.
- NFT Templates: The NFTs that belong in this Set.
- Name: The name of the Set to display when viewing the Set in the UI.

## Collections

Not to be confused with Directus' "Collection" nomenclature. Within this platform, Collections are an optional mechanism to group Sets and/or individual NFTs in a way that can incentivize an end-user to collect all of the NFTs assigned to a a Collection, or all of the NFTs in the Sets assigned to the Collection. For example, let's revisit the football card NFTs scenario described above. A Collection might represent all of the football teams in a league for the 2022 season. Each Set (again, representing a team), would contain NFTs for each player on a given team in the 2022 season. So in essence, a user who has collected all NFTs in every Set of a Collection has effectively collected all of the NFTs for each player in the 2022 football league.

Collections don't have to contain Sets. They can also just contain individual NFTs. They also contain Sets AND individual NFTs.

Note that once Set record is published, many of its fields cannot be edited. This is to maintain integrity of the acquisition incentive.

- Status: Set to "Published" once you are sure all other fields have been configured in a satisfactory manner. Otherwise, keep it as a "Draft".
- Slug: A URL-safe slug that can be referenced in the UI.
- Collection Image: A preview/cover image to represent the Collection to be shown in the UI.
- Name: The name of the Collection to display when viewing the NFT in the UI.
- Description: A more in-depth description to display when viewing the Collection in the UI.
- Metadata: If desirable, you can add a custom JSON object here for consumption via the front end. Using the football NFTs scenario, this could be something like the example JSON snippet below.
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

## Updating the data model

To update the data model you can start by locally using the Directus UI. But to ensure other developers can apply those changes you will need to write a migration file based on [knex](https://knexjs.org/). See the existing migration files for examples.

Running `npm run bootstrap` will apply new migrations. Additionally, the `package.json` contains other migration scripts (up, down, rollback, and latest) in case they're needed.
