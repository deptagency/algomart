# Deploying

The default Google Cloud Platform (GCP) infrastructural resources are managed with
[Terraform](../../terraform/README.md),
which can be automated via a
[Github Actions workflow](../../.github/workflows/deploy.yml).

There are some manual steps that we must complete **in order**
prior to running Terraform,
and some that are necessary after the applications are up and running.

## Table of Contents

1. [Create a new GCP project](./01-gcp-project-setup/README.md)
2. [Register custom domains](./02-dns-registration/README.md)
3. [Configure Firebase](./03-firebase-configuration/README.md)
4. [Assign Github Secrets](./04-github-secrets/README.md)
5. [Finalize the Github workflow](./05-github-workflow/README.md)
6. [Post-deploy steps](./06-post-deploy-steps/README.md)

## Notes

_Any given storefront environment **requires its own GCP project**._

While it would be possible to deploy multiple sets of
Terraform-managed services to a single project, we can
only configure a single Firebase instance per GCP project,
meaning each environment would then share a user pool.

Using multiple GCP projects ensures that each environment
has its own user pool.
