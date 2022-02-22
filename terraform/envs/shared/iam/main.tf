terraform {
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "rocket-fifa"

    workspaces {
      name = "iams"
    }
  }
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "4.0.0"
    }
  }
}

provider "google" {
  project = "fifa-algomart-340216"
  region  = "us-central1"
  zone    = "us-central1-a"
}

provider "google-beta" {
  project = "fifa-algomart-340216"
  region  = "us-central1"
  zone    = "us-central1-a"
}

data "google_project" "current" {}

locals {
  service_accounts = [

    ###############################################
    # Terraform Service Accounts
    # 
    # Name format: tf-<name>
    ###############################################

    {
      name = "tf-dns",
      display_name = "Terraform - DNS",
      roles = [
        "roles/domains.admin"
      ]
    },
    {
      name = "tf-iams",
      display_name = "Terraform - IAMs",
      roles = [
        "roles/iam.serviceAccountAdmin",
        "roles/resourcemanager.projectIamAdmin"
      ]
    },
    {
      name = "tf-networks",
      display_name = "Terraform - Networks",
      roles = [
        "roles/compute.networkAdmin"
      ]
    },

  ]
}

module "service_accounts" {
  for_each = { for account in local.service_accounts : account.name => account }
  source = "./service-account"

  project_id = data.google_project.current.project_id
  name = each.value.name
  display_name = each.value.display_name
  roles = each.value.roles
}
