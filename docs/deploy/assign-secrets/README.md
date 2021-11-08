# Assign Github Secrets

For the [deploy workflow](../../.github/deploy.yml) to run,
we need to configure a variety of environment variables.

## Required variables

### Project

These resources were created while [configuring the GCP project](../configure-gcp/README.md).

| Variable                   | Description                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GCP_DOCKER_REGISTRY`      | The [Artifact Registry](../configure-gcp/README.md#create-a-docker-repository) host name                                           |
| `GCP_DOCKER_REPOSITORY`    | The [Artifact Registry](../configure-gcp/README.md#create-a-docker-repository) docker repository name                              |
| `GCP_PROJECT_ID`           | The id of [the new project](../configure-gcp/README.md#create-the-project)                                                         |
| `GCP_SERVICE_ACCOUNT_KEY`  | The full, **pretty-printed** [service account JSON](../configure-gcp/README.md#create-a-service-account) created for **Terraform** |
| `TERRAFORM_BACKEND_BUCKET` | The name of the bucket created [to store Terraform state](../configure-gcp/README.md#create-a-bucket)                              |

### Domain-mapping

These were the host names we used when
[configuring DNS records](../registering-domains/README.md)
for domain-mapping.

| Variable             | Example             |
| -------------------- | ------------------- |
| `API_DOMAIN_MAPPING` | api.dev.example.com |
| `CMS_DOMAIN_MAPPING` | cms.dev.example.com |
| `WEB_DOMAIN_MAPPING` | dev.example.com     |

### Firebase

| Variable                          | Description                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `WEB_FIREBASE_SERVICE_ACCOUNT`    | The full [service account JSON](../configure-firebase/README.md#create-a-service-account) created for **Firebase** |
| `WEB_NEXT_PUBLIC_FIREBASE_CONFIG` | The Firebase [web-app config](../configure-firebase/README.md#configure-the-web-app) **converted to JSON**         |

### Algorand

To interact with the Algorand blockchain, we need access
to both an `algod` node (on MainNet or TestNet, depending on environment)
and a "funding account" that can issue transactions to create
new accounts, fund asset creation, etc.

| Variable               | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| `ALGOD_HOST`           | The host name of the `algod` server **with protocol** (ie. "https://{host-name}") |
| `ALGOD_KEY`            | The access token for the `algod` server                                           |
| `ALGOD_PORT`           | The port for the `algod` server                                                   |
| `API_FUNDING_MNEMONIC` | The 25-word mnemonic for the master funding account                               |

**Important:** The funding account used **must have funds** before
the app can be used. Without funds, admins cannot create NFTs,
users cannot create accounts, etc.

### Circle

Circle is used for processing payments.

| Variable     | Description                                                         |
| ------------ | ------------------------------------------------------------------- |
| `CIRCLE_KEY` | The private API key                                                 |
| `CIRCLE_URL` | The environment-specific URL for the API, ie. sandbox or production |

### Sendgrid

Sendgrid is used for email notifications of certain events,
such as purchase confirmation, transfer success,
or a user being out-bid in an auction.

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| `SENDGRID_FROM_EMAIL` | The sender email for notifications |
| `SENDGRID_KEY`        | The private API key                |

### Miscellaneous

The remaining variables are up to the user to create and configure.
Once created, these **MUST NOT CHANGE** because it will prevent the
storefront from decrypting necessary values,
or it might cause Terraform to try to destroy stateful resources
like the database or storage bucket, etc.

| Variable                     | Description                                                                                                 | Changeable                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `API_CREATOR_PASSPHRASE`     | The secret used to encrypt new Algorand account mnemonics so they can be (reasonably) safely stored at rest | **NO** - Will prevent application from decrypting the mnemonics for the API-generated asset creator accounts    |
| `API_DATABASE_USER_NAME`     | The name for the API application's database user                                                            | TODO                                                                                                            |
| `API_DATABASE_USER_PASSWORD` | The password for the API application's database user                                                        | TODO                                                                                                            |
| `API_KEY`                    | For authentication with the API                                                                             | TODO                                                                                                            |
| `API_SECRET`                 | Private secret used in encryption                                                                           | **NO**                                                                                                          |
| `CMS_ADMIN_EMAIL`            | The email address for the initial admin user created by Directus                                            | **NO** - Changing has no effect, since Directus only bootstraps the user on first run                           |
| `CMS_ADMIN_PASSWORD`         | The password for the initial admin user created by Directus                                                 | **NO** - Changing has no effect, since Directus only bootstraps the user on first run                           |
| `CMS_DATABASE_USER_NAME`     | The name for the CMS application's database user                                                            | TODO                                                                                                            |
| `CMS_DATABASE_USER_PASSWORD` | The password for the CMS application's database user                                                        | TODO                                                                                                            |
| `CMS_KEY`                    | The private token with which to make authenticated requests against the CMS                                 | **YES** - If changed, the admin user needs their token updated so the API can continue to authenticate          |
| `CMS_SECRET`                 | Private secret used in encryption                                                                           | **NO**                                                                                                          |
| `CMS_STORAGE_BUCKET`         | The name of the bucket for Terraform to create to store CMS assets - must not already be in use             | **NO** - Changing this will cause Terraform to attempt to destroy the old bucket and remove all existing assets |

## Optional

TODO Describe the optional pass-through variables to affect Terraform deploy.
