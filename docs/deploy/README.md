# Deploying

The default Google Cloud Platform (GCP) infrastructure is set up using [Terraform](../../terraform/README.md),
which is automated via a [Github Actions workflow](../../.github/workflows/deploy.yml).

While Terraform is responsible for creating and managing changes to
the resources that comprise the applications themselves,
there are a number of manual steps that we have to take before we
are ready to deploy.

## Table of Contents

- [Create a new GCP project](./configure-gcp/README.md)
- [Register custom domains](./registering-domains/README.md)
- [Configure Firebase](./configure-firebase/README.md)
- [Assign Github Secrets](./assign-secrets/README.md)
- [Running the deploy workflow](../../.github/workflows/deploy.yml)
- [Post-deploy steps](./post-deploy/README.md)
