# Assign Github Secrets

For the [deploy workflow](../../.github/deploy.yml) to run,
we need to configure a variety of environment variables.

## Required variables

### Project

These resources were created while [configuring the GCP project](../01-gcp-project-setup/README.md).

| Variable                   | Description                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GCP_DOCKER_REGISTRY`      | The [Artifact Registry](../01-gcp-project-setup/README.md#4-create-a-docker-repository) host name                                           |
| `GCP_DOCKER_REPOSITORY`    | The [Artifact Registry](../01-gcp-project-setup/README.md#4-create-a-docker-repository) docker repository name                              |
| `GCP_PROJECT_ID`           | The id of [the new project](../01-gcp-project-setup/README.md#create-the-project)                                                           |
| `GCP_SERVICE_ACCOUNT_KEY`  | The full, **pretty-printed** [service account JSON](../01-gcp-project-setup/README.md#5-create-a-service-account) created for **Terraform** |
| `TERRAFORM_BACKEND_BUCKET` | The name of the bucket created [to store Terraform state](../01-gcp-project-setup/README.md#3-create-a-bucket)                              |

### Domain-mapping

These were the host names we used when
[configuring DNS records](../02-dns-registration/README.md)
for domain-mapping.

These **MUST NOT** include `https://` prefix.

| Variable             | Example             |
| -------------------- | ------------------- |
| `API_DOMAIN_MAPPING` | api.dev.example.com |
| `CMS_DOMAIN_MAPPING` | cms.dev.example.com |
| `WEB_DOMAIN_MAPPING` | dev.example.com     |

### Firebase

These variables contain JSON values generated when
[configuring Firebase](../03-firebase-configuration/README.md).

| Variable                          | Description                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `WEB_FIREBASE_SERVICE_ACCOUNT`    | The full [service account JSON](../03-firebase-configuration/README.md#5-create-a-service-account) created for **Firebase** |
| `WEB_NEXT_PUBLIC_FIREBASE_CONFIG` | The Firebase [web-app config](../03-firebase-configuration/README.md#4-configure-the-web-app) **converted to JSON**         |

### Algorand

To interact with the Algorand blockchain, we need access
to both an `algod` node (on MainNet or TestNet, depending on environment)
and a "funding account" that can issue transactions to create
new accounts, fund asset creation, etc.

| Variable               | Description                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ALGOD_ENV`            | Block chain environment, can be `mainnet`, `betanet`, or `testnet` (default) Block chain environment, can be `mainnet`, `betanet`, or `testnet` (default) |
| `ALGOD_HOST`           | The host name of the `algod` server - this **MUST** include `https://` prefix.                                                                            |
| `ALGOD_KEY`            | The access token for the `algod` server                                                                                                                   |
| `ALGOD_PORT`           | The port for the `algod` server                                                                                                                           |
| `API_FUNDING_MNEMONIC` | The 25-word mnemonic for the master funding account                                                                                                       |

**Important:** The funding account used **must have funds** before
the app can be used. Without funds, admins cannot create NFTs,
users cannot create accounts, etc.

### Circle

Circle is used for processing payments.

| Variable     | Description                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `CIRCLE_KEY` | The private API key                                                                                            |
| `CIRCLE_URL` | The environment-specific URL for the API, ie. sandbox or production - this **MUST** include `https://` prefix. |

### Email Dispatching

Emails are dispatched when various actions are taken by a user (claimed assets, bid notifications, etc.). These emails can be sent using SMTP (via [Nodemailer](https://nodemailer.com/about/)) or via [Sendgrid](https://sendgrid.com/). Alternatively, other email transports could be added with relative ease following the existing patterns within the API code.

Regardless of which out-of-the-box approach you take, the following variables are required:

| Variable          | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `EMAIL_TRANSPORT` | `smtp` or `sendgrid`                                             |
| `EMAIL_FROM`      | The sender name                                                  |
| `EMAIL_NAME`      | The sender email address                                         |
| `SMTP_PORT`       | Valid port for `smtp` or just a non-falsy integer for `sendgrid` |

If `EMAIL_TRANSPORT` is set to `smtp`, the following variables are required:

| Variable        | Description   |
| --------------- | ------------- |
| `SMTP_HOST`     | SMTP host     |
| `SMTP_USER`     | SMTP user     |
| `SMTP_PASSWORD` | SMTP password |

If `EMAIL_TRANSPORT` is set to `sendgrid`, the following variable is required:

| Variable           | Description                               |
| ------------------ | ----------------------------------------- |
| `SENDGRID_API_KEY` | The Sendgrid API key provided by Sendgrid |

### IPFS Storage

To persist assets on the [IPFS](https://ipfs.io/), [Pinata](https://pinata.cloud/) is used in background tasks to store newly generated collectibles. This helps ensure the integrity of ASAs since IPFS content IDs are stored in metadata associated with the on-chain assets to adhere to [ARC3 standards](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md).

_Note: Pinata allows storage up to 1GB storage for free. This might be suitable for smaller storefronts with lightweight assets. However, if the storefront has many assets (particularly larger media types such as audio or video), a paid account is recommended._

| Variable            | Description                       |
| ------------------- | --------------------------------- |
| `PINATA_API_KEY`    | The API key provided by Pinata    |
| `PINATA_API_SECRET` | The API secret provided by Pinata |

### Miscellaneous

The remaining variables are up to the user to create and configure.
Once created, these **MUST NOT CHANGE** because it will prevent the
storefront from decrypting necessary values,
or it might cause Terraform to try to destroy stateful resources
like the database or storage bucket, etc.

| Variable                     | Description                                                                                                 | Changeable                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `API_CREATOR_PASSPHRASE`     | The secret used to encrypt new Algorand account mnemonics so they can be (reasonably) safely stored at rest | ❌ Will prevent application from decrypting the mnemonics for the API-generated asset creator accounts    |
| `API_DATABASE_USER_NAME`     | The name for the API application's database user                                                            | ❌ User must remain constant, since database tables are owned by (and only visible to) the original user  |
| `API_DATABASE_USER_PASSWORD` | The password for the API application's database user                                                        | ✔️                                                                                                        |
| `API_KEY`                    | For authentication with the API                                                                             | ✔️                                                                                                        |
| `API_SECRET`                 | Private secret used in encryption                                                                           | ❌ Changing this will prevent the API from decrypting previously-encrypted data                           |
| `CMS_ADMIN_EMAIL`            | The email address for the initial admin user created by Directus                                            | ❌ Changing has no effect, since Directus only bootstraps the user on first run                           |
| `CMS_ADMIN_PASSWORD`         | The password for the initial admin user created by Directus                                                 | ❌ Changing has no effect, since Directus only bootstraps the user on first run                           |
| `CMS_DATABASE_USER_NAME`     | The name for the CMS application's database user                                                            | ❌ User must remain constant, since database tables are owned by (and only visible to) the original user  |
| `CMS_DATABASE_USER_PASSWORD` | The password for the CMS application's database user                                                        | ✔️                                                                                                        |
| `CMS_KEY`                    | The private token with which to make authenticated requests against the CMS                                 | ✔️ If changed, the admin user needs their token updated so the API can continue to authenticate           |
| `CMS_SECRET`                 | Private secret used in encryption                                                                           | ❌ Changing this will prevent the CMS from decrypting previously-encrypted data                           |
| `CMS_STORAGE_BUCKET`         | The name of the bucket for Terraform to create to store CMS assets - must not already be in use             | ❌ Changing this will cause Terraform to attempt to destroy the old bucket and remove all existing assets |

## Optional

Terraform has a number of
[default variables](../../../terraform/variables.tf)
that can be overridden at deploy time.
See the
[complete list](../../../terraform/README.md#input-variables)
of all input variables and descriptions,
including which are optional, for further information.
You may note that some of the required variables did not need corresponding
Secrets; those are specified programmatically in the deploy workflow.

To override any variable, simply add a Github Secret with an
all-caps version of the name. Eg. to set `bucket_location` to
a non-default value, create a `BUCKET_LOCATION` secret with your desired value.

You can see where these are mapped to their corresponding Terraform
environment variables [here](../../../.github/workflows/deploy.yml#L159).

---

## Next Up

[Finalizing the Github Workflow](../05-github-workflow/README.md)
