terraform {
  required_version = ">= 0.14"

  backend "gcs" {}

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "3.81"
    }
  }
}

provider "google" {
  credentials = var.credentials
  project     = var.project
  region      = var.region
}
