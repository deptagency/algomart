# Terraform

These templates serve as a reasonable set of defaults
for spinning up a simple storefront setup,
consisting of:

- A database server
- Two database instances, one each for the API and CMS
- Two database users, one each for the API and CMS
- A storage bucket for assets uploaded in the CMS
- A VPC and various networking utilities to facilitate Cloud Run -> Cloud SQL
- Cloud Run services for:
  - The API
  - The CMS
  - The web front-end

While building Docker images and deploying via Terraform
is automated by the
[Github workflow](../.github/workflows/deploy.yml)
and associated [Github secrets](../docs/deploy/assign-secrets/README.md),
it is possible to build images and deploy manually if desired.

This requires:

- [Specifying input variables](#input-variables)
- [Configuring `gcloud` and `docker`](#authorize-gcloud)
- [Pushing docker images](#build-and-push-docker-images)
- [Initializing Terraform](#initialize-terraform)
- [Applying Terraform](#apply-terraform)

## Input variables

The configuration is [fairly parameterized](./variables.tf).
Any input variable without a default value needs to be supplied when we want to
either `terraform plan` or `terraform apply`.

You can specify them via stdin while running a command, but it's easier
to either create a `terraform.tfvars` file or supply them as environment variables.
See the [sample file](./sample.terraform.tfvars) for example values.

Again, you must supply every variable that does not have a default value;
and you are free to override any variables that do.

### Required

| Variable                          | Description                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `algod_env`                       | Block chain environment, can be `mainnet`, `betanet`, or `testnet` (default)                                                |
| `algod_host`                      | Host name or IP address of the Algod server                                                                                 |
| `algod_key`                       | Access token for the Algod server                                                                                           |
| `algod_port`                      | Access port for the Algod server                                                                                            |
| `api_creator_passphrase`          | The passphrase to use for encrypting new Algorand account mnemonics                                                         |
| `api_database_user_name`          | The API application's database role                                                                                         |
| `api_database_user_password`      | The API application's database password                                                                                     |
| `api_domain_mapping`              | The domain name for the API server                                                                                          |
| `api_funding_mnemonic`            | The secret mnemonic for the Algorand account used to fund all asset creation and transactions                               |
| `api_image`                       | The repository-qualified name and tag for the API docker image                                                              |
| `api_key`                         | The access token for the API                                                                                                |
| `api_revision_name`               | The unique name for the API's latest Cloud Run revision<sup>2</sup>                                                         |
| `api_secret`                      | The secret used during encryption                                                                                           |
| `circle_key`                      | The access token for Circle                                                                                                 |
| `circle_url`                      | The API URL for Circle                                                                                                      |
| `cms_admin_email`                 | The email for the initial CMS admin user                                                                                    |
| `cms_admin_password`              | The password for the initial CMS admin user                                                                                 |
| `cms_database_user_name`          | The CMS application's database role                                                                                         |
| `cms_database_user_password`      | The CMS application's database password                                                                                     |
| `cms_domain_mapping`              | The domain name for the CMS server                                                                                          |
| `cms_image`                       | The repository-qualified name and tag for the CMS docker image                                                              |
| `cms_key`                         | The access token for the CMS                                                                                                |
| `cms_revision_name`               | The unique name for the CMS's latest Cloud Run revision<sup>2</sup>                                                         |
| `cms_secret`                      | TODO                                                                                                                        |
| `cms_storage_bucket`              | The GCS bucket name in which to store assets such as images                                                                 |
| `credentials`                     | The JSON credentials (newline-delimited) for the service account that Terraform will use to manage state and all resources. |
| `project`                         | The id (not project number) of the GCP project that will own all resources                                                  |
| `pinata_api_key`                  | The API key from https://pinata.cloud that allows files and metadata to be stored on IPFS                                   |
| `pinata_api_secret`               | The API secret from https://pinata.cloud that allows files and metadata to be stored on IPFS                                |
| `sendgrid_api_key`                | The access token for SendGrid, only required when `email_transport` is set to `sendgrid`                                    |
| `email_from`                      | The sender email address                                                                                                    |
| `email_transport`                 | Either `sendgrid` or `smtp`                                                                                                 |
| `email_name`                      | The sender name                                                                                                             |
| `smtp_host`                       | The SMTP hostname, only required when `email_transport` is set to `smtp`                                                    |
| `smtp_port`                       | The SMTP port, a valid port is required when `email_transport` is set to `smtp`, otherwise, set to a non-falsy integer      |
| `smtp_user`                       | The SMTP user, only required when `email_transport` is set to `smtp`                                                        |
| `smtp_password`                   | The SMTP password, only required when `email_transport` is set to `smtp`                                                    |
| `web_domain_mapping`              | The domain name for the front-end web server                                                                                |
| `web_firebase_service_account`    | The private service account JSON credentials for Firebase authentication                                                    |
| `web_image`                       | The repository-qualified name and tag for the front-end server docker image                                                 |
| `web_next_public_firebase_config` | The publicly-viewable Firebase JSON configuration for authentication                                                        |
| `web_revision_name`               | The unique name for the web front-end's latest Cloud Run revision<sup>2</sup>                                               |

### Optional

| Variable                    | Description                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api_database_name`         | Name of the API-specific database within the database server                                                                                                                                                                                                                                                                                                           |
| `api_database_schema`       | The database schema for the API tables                                                                                                                                                                                                                                                                                                                                 |
| `api_service_name`          | Name of the Cloud Run API service<sup>1</sup>                                                                                                                                                                                                                                                                                                                          |
| `bucket_location`           | [Geographic location](https://cloud.google.com/storage/docs/locations#available-locations) of the bucket, which determines latency and availability (and whether it's multi- or single- region)                                                                                                                                                                        |
| `cms_database_name`         | Name of the CMS-specific database within the database server                                                                                                                                                                                                                                                                                                           |
| `api_database_schema`       | The database schema for the CMS tables                                                                                                                                                                                                                                                                                                                                 |
| `cms_service_name`          | Name of the Cloud Run CMS service<sup>1</sup>                                                                                                                                                                                                                                                                                                                          |
| `database_max_connections`  | Maximum number of database connections to allow, if more than [the default limit](https://cloud.google.com/sql/docs/postgres/quotas#cloud-sql-for-postgresql-connection-limits) is needed (especially for smaller tiers). A minimum of 50 is recommended, based on the number of connections made across the CMS server, the API server, and the API background tasks. |
| `database_server_name`      | Name of the Cloud SQL database server instance<sup>1</sup>                                                                                                                                                                                                                                                                                                             |
| `database_server_tier`      | Size of the PostgreSQL database [shared-CPU](https://cloud.google.com/sql/pricing#instance-pricing) instance. If a dedicated CPU instance is required, the Terraform configuration will likely need to be updated.                                                                                                                                                     |
| `disable_apis_on_destroy`   | Whether or not to disable the GCP APIs (like Cloud Run, etc) when the project is destroyed; helpful if creating resources in a project that has other resources managed through other processes.                                                                                                                                                                       |
| `private_ip_name`           | Name of the Global Address private IP assigned to the database server for private connections from Cloud Run<sup>1</sup>                                                                                                                                                                                                                                               |
| `region`                    | The GCP region for the project and services                                                                                                                                                                                                                                                                                                                            |
| `vpc_access_connector_name` | Name of the VPC Access Connector used by Cloud Run to connect to database server<sup>1</sup>                                                                                                                                                                                                                                                                           |
| `vpc_name`                  | Name of the VPC used by Cloud Run to connect to database server<sup>1</sup>                                                                                                                                                                                                                                                                                            |
| `web_next_public_3js_debug` | TODO                                                                                                                                                                                                                                                                                                                                                                   |
| `web_service_name`          | Name of the Cloud Run front-end web service<sup>1</sup>                                                                                                                                                                                                                                                                                                                |

> <sup>1</sup> Resource names are primarily only really useful to override if there
> are existing resources with competing names, since they need to be unique.
>
> <sup>2</sup> Every change to a Cloud Run service requires a new revision and new
> unique name. Cloud Run autogenerates them, but if a revision is made manually in the
> UI (for instance, to temporarily change an environment variable) it will cause issues
> with Terraform state. The easiest solution is to manually generate names when
> deploying via Terraform in a format that is distinct from Cloud Run's format.

## Authorize gcloud

Whether building and deploying locally or via CI/CD,
the docker images built for the different services should be pushed
to the Artifact Registry docker repository created above.

You will first need to authenticate `glcoud` using the service account
credentials for the project.

```bash
$ gcloud auth activate-service-account --key-file=<service-account.json>
```

Next, `docker` needs to be configured to authenticate with `gcloud`
for the given registry. For instance, if the repository was created
in the `us-east4` region, the registry will be `us-east4-docker.pkg.dev`.

```bash
$ gcloud auth configure-docker us-east4-docker.pkg.dev
```

## Build and push docker images

Now we can build the docker images, naming them with a prefix specifying:

- The regional registry
- The GCP project
- The AR repository name

Again, assuming `us-east4` region, a GCP project id of "my-project",
and an Artifact Registry repository named "storefront", building and
pushing the API service image would look like:

```bash

$ docker build \
    -f <project-root>/docker/deploy/api/Dockerfile \
    -t us-east4-docker.pkg.dev/my-project/storefront/api:latest \
    .

$ docker push us-east4-docker.pkg.dev/my-project/storefront/api:latest
```

When deploying via Terraform, save the `us-east4-docker.pkg.dev/my-project/storefront/api:latest`
image name in the `api_image` variable,
and do the same for both the CMS and the web front-end.

> **Note:** You will want to **avoid the `latest` tag**,
> as Terraform will not be able to detect that the images have been changed
> and will not issue new Cloud Run revisions.

## Initialize Terraform

Before we can set up infrastructure, we have to configure where
Terraform stores its state file.
The [current configuration](./main.tf#L4) specifies using a GCS bucket as
the storage location (rather than, say, locally on the machine running `terraform`),
so we need to specify the bucket name and optionally a prefix for the state file
(if we want it nested in a folder inside the bucket).

Terraform also needs access to the bucket via a service account
key stored in the `GOOGLE_CREDENTIALS` environment variables.
The value of the variable needs to be the JSON key itself, newlines included,
rather than a filename.

```bash

# Supply the JSON directly
$ export GOOGLE_CREDENTIALS='{
  "type": "service_account",
  "project_id": "<project-id>",
  ...rest of JSON
}'

# Or load from the JSON file
$ export GOOGLE_CREDENTIALS=$( cat path/to/credentials.json )

# Initialize terraform
$ terraform init \
    -backend-config="bucket=<bucket-nane>" \
    -backend-config="prefix=my/terraform"
```

With any luck, you should see output like the following:

```
Initializing the backend...

Successfully configured the backend "gcs"! Terraform will automatically
use this backend unless the backend configuration changes.

Initializing provider plugins...
- Reusing previous version of hashicorp/google from the dependency lock file
- Using previously-installed hashicorp/google v3.81.0

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

**Note:** If there was already a state file stored at that location,
Terraform will sync the initialized files in the hidden `<project-root>/terraform/.terraform` local directory
and will not attempt to re-create any resources.

## Apply Terraform

With all input variables defined, you can run `terraform plan` for an overview of the resources that will be created,
and `terraform apply` to set up the infrastructure.

The initial setup will take a decent amount of time, given that the database server alone might take 5-10 minutes to provision.

## Troubleshooting

### State lock

Terraform creates a "lock file" when it is actively querying or updating the stack via `plan` or `apply`, respectively.
If the process exits prematurely, it might not clean the file up, and subsequent attempts to run those commands
will fail.

If the lock id has been output at some point, you can clean this up via `terraform force-unlock <lock_id>`.
If not, you will have to delete the lock file manually - you can find it in the same location as the state file.
