resource "google_project_service" "compute_api" {
  project = var.project_id
  service = "compute.googleapis.com"

  disable_on_destroy = true
}

resource "google_project_service" "resource_manager_api" {
  project = var.project_id
  service = "cloudresourcemanager.googleapis.com"

  disable_on_destroy = true
}

resource "google_compute_network" "vpc" {
  name = var.vpc_name

  depends_on = [
    google_project_service.compute_api,
    google_project_service.resource_manager_api,
  ]
}

resource "google_compute_global_address" "private_ip" {
  name          = var.private_ip_name
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "vpc_conn" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]

  depends_on = [
    google_project_service.networking_api,
  ]
}
