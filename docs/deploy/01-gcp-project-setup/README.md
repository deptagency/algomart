# Configuring a new GCP project

This section will detail the creation and configuration of a new
GCP project to houes all of the Terraform-managed resources
for the storefront.

The primary reason that the storefront relies on having its own
dedicated project is that it relies on Firebase for authentication,
which must be configured at the project-level (as GCP does not allow
multiple Firebase instances in the same project).

## Table of Contents

1. [Create the project](#1-create-the-project)
2. [Assign a billing account](#2-assign-a-billing-account)
3. [Create a storage bucket for Terraform](#3-create-a-bucket)
4. [Create an Artifact Registry docker repository](#4-create-a-docker-repository)
5. [Create a service account for Terraform](#5-create-a-service-account)

## 1. Create the project

Create a new GCP project by following the
[official instructions](https://cloud.google.com/resource-manager/docs/creating-managing-projects).

Upon creation, make a note of the **project id** (not the project number).
We will need this later when configuring Github Secrets.

> ![project id](./images/new-project.png)

## 2. Assign a billing account

TODO

## 3. Create a bucket

TODO

## 4. Create a docker repository

In your GCP project, open the services menu.

> ![open menu](./images/service-account/new-service-account-01.png)

Scroll down to the "CI/CD" section and click "Artifact Registry".

> ![00](./images/artifact-registry/enable-ar-01-menu.png)

Being a new GCP project, you will need to click "Enable".

> ![01](./images/artifact-registry/enable-ar-02-enable.png)

Now click "Create repository".

> ![click create](./images/artifact-registry/enable-ar-03-click-create.png)

Here, assign the repository a name, make sure "Docker" is selected,
and assign a region. (Most likely same as project region.).
Then click "Create".

> ![fill in form](./images/artifact-registry/enable-ar-04-create.png)

Once created, click the repository name in the table
to go to the repository details.

> ![select the repository](./images/artifact-registry/enable-ar-05-select.png)

Find the **registry name** - it will look something like `<region>-docker.pkg.dev`.

> ![record the registry](./images/artifact-registry/enable-ar-06-regions.png)

## 5. Create a service account

The service account is an identity that Terraform can use to perform
GCP API operations.
In this step, we'll create a new account with the required roles
and download a JSON file with the private key.

> **Disclaimer:** Service account roles should only give terraform the
> absolute minimum power necessary to perform all functions. **The roles outlined
> farther below** are believed to be the minimum set, but there is a chance that
> they **might be more elevated than they need to be**.
>
> Feel free to try restricting them further - if there is a less-priviledged set of
> roles that still allow full resource management, please let us know so that we can
> update the instructions accordingly.

In your GCP project, open the services menu.

> ![open menu](./images/service-account/new-service-account-01.png)

Then, scroll down to IAM and select "Service Accounts".

> ![select service accounts](./images/service-account/new-service-account-02.png)

From here, click "Create Service Account".

> ![create account](./images/service-account/new-service-account-03.png)

Give the account a recognizable name and, if desired, a description.
When done, click "Create and Continue".

> ![name and continue](./images/service-account/new-service-account-04-name.png)

Now "Add Another Role" until the following four are assigned, and then click "Continue".

> ![add roles](./images/service-account/new-service-account-05-roles.png)

You can choose to assign users or groups to this account so they can perform actions with it if you'd like.
If not, or once done, click "Done".

> ![done](./images/service-account/new-service-account-06-finish.png)

Now find the service account in the list and click the email to go to the account details screen.

> ![select account](./images/service-account/new-service-account-07-list.png)

Once there, click on "Keys".

> ![select keys](./images/service-account/new-service-account-08-details.png)

Select "Add Key" and click "Create new key".

> ![create key](./images/service-account/new-service-account-09-new-key.png)

Make sure that JSON is selected and then click "Create".
You will be prompted to open or download the resulting key - **make sure to save it** because you **cannot recover it later**.

> ![select json](./images/service-account/new-service-account-10-json-done.png)

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

## Next Up

[Registering custom domains](../02-dns-registration/README.md)
