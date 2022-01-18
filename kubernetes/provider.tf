provider "google" {
  region  = var.region
  project = var.project_id
}

provider "kubernetes" {
  host                   = "https://${module.gke.endpoint}"
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
  token                  = data.google_client_config.provider.access_token
}

data "google_client_config" "provider" {}