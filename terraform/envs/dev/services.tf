resource "google_project_service" "compute_api" {
  project = var.project
  service = "compute.googleapis.com"

  disable_on_destroy = var.disable_apis_on_destroy
}

resource "google_project_service" "networking_api" {
  project = var.project
  service = "servicenetworking.googleapis.com"

  disable_on_destroy = var.disable_apis_on_destroy
}

resource "google_project_service" "resource_manager_api" {
  project = var.project
  service = "cloudresourcemanager.googleapis.com"

  disable_on_destroy = var.disable_apis_on_destroy
}

resource "google_project_service" "run_api" {
  project = var.project
  service = "run.googleapis.com"

  disable_on_destroy = var.disable_apis_on_destroy
}

resource "google_project_service" "sql_api" {
  project = var.project
  service = "sqladmin.googleapis.com"

  disable_on_destroy = var.disable_apis_on_destroy
}

resource "google_project_service" "vpcaccess_api" {
  project = var.project
  service = "vpcaccess.googleapis.com"

  disable_on_destroy = var.disable_apis_on_destroy
}
