# Terraform setup

Terraform templates for setting up a full storefront environment on Google Cloud
and storing terraform state in a GCS bucket.

The templates have been parameterized as much as possible to minimize
assumptions about where services should live, how the GCP project is managed,
how various services should be sized, etc.

For example, multiple environments can be created in a single
GCP project if desired, if service name defaults are overridden,
and the database server instance size can vary by parameter.

## Initial setup

While terraform will handle creating and managing most of the resources, a few things
need to exist prior to running `terraform apply`.

- A Google Cloud project to house all resources
- A GCS bucket for storing terraform state (terraform cannot create this)
- A service account with appropriate IAM roles for terraform to use<sup>1</sup>
- An Artifact Registry docker repository for storing docker images
- CNAME records with our DN registrar (this can be done either before or after the first deploy)

The project, bucket, and service account do not need to be new;
existing resources can be used if desired.

> <sup>1</sup> **Disclaimer:** Service account roles should only give terraform the
> absolute minimum power necessary to perform all functions. **The roles outlined
> farther below** are believed to be the minimum set, but there is a chance that
> they **might be more elevated than they need to be**.
>
> Feel free to try restricting them further - if there is a less-priviledged set of
> roles that still allow full resource management, please let us know so that we can
> update the instructions accordingly.

### Getting the project id

There is no requirement that the project needs to be new.
[Create a new project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) if desired
or use an existing one.

In either case, **locate the project id** (not the project number) for later use.

> ![project id](./docs/new-project.png)

### Creating a service account

The service account is an identity that terraform can use to perform GCP API operations.
In this step, we'll create a new account with the required roles and
download a JSON file with the private key.

In your GCP project, open the services menu.

> ![open menu](./docs/new-service-account-01.png)

Then, scroll down to IAM and select "Service Accounts".

> ![select service accounts](./docs/new-service-account-02.png)

From here, click "Create Service Account".

> ![create account](./docs/new-service-account-03.png)

Give the account a recognizable name and, if desired, a description.
When done, click "Create and Continue".

> ![name and continue](./docs/new-service-account-04-name.png)

Now "Add Another Role" until the following four are assigned, and then click "Continue".

> ![add roles](./docs/new-service-account-05-roles.png)

You can choose to assign users or groups to this account so they can perform actions with it if you'd like.
If not, or once done, click "Done".

> ![done](./docs/new-service-account-06-finish.png)

Now find the service account in the list and click the email to go to the account details screen.

> ![select account](./docs/new-service-account-07-list.png)

Once there, click on "Keys".

> ![select keys](./docs/new-service-account-08-details.png)

Select "Add Key" and click "Create new key".

> ![create key](./docs/new-service-account-09-new-key.png)

Make sure that JSON is selected and then click "Create".
You will be prompted to open or download the resulting key - **make sure to save it** because you **cannot recover it later**.

> ![select json](./docs/new-service-account-10-json-done.png)

You should have a JSON file that looks approximately like this:

```json
{
  "type": "service_account",
  "project_id": "<project-id>",
  "private_key_id": "abc..snip...xyz",
  "private_key": "-----BEGIN PRIVATE KEY-----\nABC... snip ...XYZ\n-----END PRIVATE KEY-----\n",
  "client_email": "<user>@<project-id>.iam.gserviceaccount.com",
  "client_id": "123... snip ...789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/<user>%40<project-id>.iam.gserviceaccount.com"
}
```

Notice that this file contains new-lines.
It is **vitally important to retain newlines** in the JSON key wherever we use it -
even in an environment variable, even if we base-64 encode it.

Without newlines, **terraform cannot authenticate**.
For whatever reason, Google tools require them.

---

### Set up DNS for domain mapping

This setup assumes
[domain mapping](https://cloud.google.com/run/docs/mapping-custom-domains)
will be used to assign custom host names to the Cloud Run services.
If load balancers [need to be](#explicit-load-balancers) set up, then the DNS setup will differ.

If the domain being used is managed by Google Domains,
the service account needs to be set as a
[verified owner of the domain](https://cloud.google.com/run/docs/mapping-custom-domains#adding_verified_domain_owners_to_other_users_or_service_accounts)
using the email address generated during service account creation.
This email can be found in either the "IAM -> Service Accounts" dashboard or
under the `client_email` property of the service account JSON key.

We need to create 3 different CNAME records.
With Cloud Run domain mapping, they'll all point to the same location.
For custom load balancers, you'll need to use their IP addresses instead.

For instance, assuming we want the services mapped to the following host names...

| Service |              Host name |
| ------- | ---------------------: |
| API     | `api.nfty.example.com` |
| CMS     | `cms.nfty.example.com` |
| Web     |     `nfty.example.com` |

... then we'll want CNAME records for all three of those host names mapped to `ghs.googlehosted.com.` (note the trailing period).

> ![CNAME records](./docs/cname-records.png)

The Cloud Run domain mapping resource templates will do the rest of the work
to associate the services with their respectiving mappings.

> Note: The CNAME records can be created either before or after the Cloud Run services
> are set up. Domain mapping via terraform will be 'successful' in either case,
> but the custom domain resources in Cloud Run will not work until the records
> are created.

### Create an Artifact Registry docker repository

In your GCP project, open the services menu.

> ![open menu](./docs/new-service-account-01.png)

Scroll down to the "CI/CD" section and click "Artifact Registry".

> ![00](./docs/enable-ar-01-menu.png)

If this is a new project (or Artifact Registry has never been used) you will need to click "Enable".

> ![01](./docs/enable-ar-02-enable.png)

Now click "Create repository".

> ![click create](./docs/enable-ar-03-click-create.png)

Here, give the repository a name, make sure "Docker" is selected,
and assign a region. (Most likely same as project region.).
Then click "Create".

> ![fill in form](./docs/enable-ar-04-create.png)

Once created, click the repository name in the table
to go to the repository details.

> ![select the repository](./docs/enable-ar-05-select.png)

Find the **registry name** - it will look something like `<region>-docker.pkg.dev`.

> ![record the registry](./docs/enable-ar-06-regions.png)

## Build docker images

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
image name in the `api_image` variable.

> **Note:** You will want to **avoid the `latest` tag**,
> as Terraform will not be able to detect that the images have been changed
> and will not issue new Cloud Run revisions.

---

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

---

## Deploy

### Input variables

The configuration is [fairly parameterized](./variables.tf).
Any input variable without a default value needs to be supplied when we want to
either `terraform plan` or `terraform apply`.

You can specify them via stdin while running a command, but it's easier
to either create a `terraform.tfvars` file or supply them as environment variables.
See the [sample file](./sample.terraform.tfvars) for example values.

Again, you must supply every variable that does not have a default value;
and you are free to override any variables that do.

#### **Required**

| Variable                          | Description                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
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
| `sendgrid_key`                    | The access token for Sendgrid                                                                                               |
| `sendgrid_from_email`             | The sender email for Sendgrid                                                                                               |
| `web_domain_mapping`              | The domain name for the front-end web server                                                                                |
| `web_firebase_service_account`    | The private service account JSON credentials for Firebase authentication                                                    |
| `web_image`                       | The repository-qualified name and tag for the front-end server docker image                                                 |
| `web_next_public_firebase_config` | The publicly-viewable Firebase JSON configuration for authentication                                                        |
| `web_revision_name`               | The unique name for the web front-end's latest Cloud Run revision<sup>2</sup>                                               |

#### **Optional**

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

### Deploying

With all input variables defined, you can run `terraform plan` for an overview of the resources that will be created,
and `terraform apply` to set up the infrastructure.

The initial setup will take a decent amount of time, given that the database server alone might take 5-10 minutes to provision.

#### Troubleshooting state lock

Terraform creates a "lock file" when it is actively querying or updating the stack via `plan` or `apply`, respectively.
If the process exits prematurely, it might not clean the file up, and subsequent attempts to run those commands
will fail.

If the lock id has been output at some point, you can clean this up via `terraform force-unlock <lock_id>`.
If not, you will have to delete the lock file manually - you can find it in the same location as the state file.

## Final setup

### Assign the access key to the CMS admin

The API was deployed with a `CMS_ACCESS_TOKEN` environment variable,
and the CMS should have an initial admin user created from the
`ADMIN_EMAIL` and `ADMIN_PASSWORD` variables during the initial deploy.

Now we need to log into the CMS websitem, visit the User Directory,
and click the empty thumbnail for the newly-created user.

> ![user directory](./docs/cms-admin-key-01.png)

Next, we need to copy the value of the `CMS_ACCESS_TOKEN` API environment variable,
paste it into the "Token" field, and click the green checkmark to save.

> ![user directory](./docs/cms-admin-key-02.png)

Assigning the token to this user allows the API to make authenticated and authorized
requests against the CMS.
Without this step, API background tasks that look for pack templates, etc. will fail
to run, meaning we cannot create assets on the blockchain.

---

## Likely infrastructural changes

The default infrastructure _should_ be a good starting point for any new project,
but it can also serve as a base for a more tailored environment.

A few examples of some potential desired changes are below.

### Database setup

The templates describe a single database server instance but define two different databases
within the server - one for the CMS and one for the API - and two different database users.

Possible changes might include:

- Housing the CMS and API databases in _separate servers_
- Using a single user for both applications
- Using a single database for the CMS and API schemas
- Using a dedicated CPU instance rather than shared

Any changes should be easy enough to accomplish with minor updates to the templates.

### Explicit load balancers

While domain mapping is a simple and clean way to assign custom domain names to each Cloud Run service,
it is still a beta offering and [is not available](https://cloud.google.com/run/docs/mapping-custom-domains#limitations)
in most regions.

If you want to set up a project in an unsupported region (or you want more control over the proxy),
you will need to [set up load balancers](https://cloud.google.com/load-balancing/docs/https/setting-up-https-serverless) manually.

### Migration strategies

Currently, API and CMS migrations are bundled with their respective docker images and
executed in an entrypoint script.

This actually causes the migration tools to run not only when the Cloud Run services are
_created or updated_, but also when the containers are _spun back up_ after being idled for a time.
