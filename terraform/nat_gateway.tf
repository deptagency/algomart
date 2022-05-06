resource "google_compute_router" "cloud_router" {
  name    = var.vpc_cloud_router_name
  network = google_compute_network.vpc.name
  region  = var.region
}

resource "google_compute_address" "static" {
  name         = var.public_outbound_ip_name
  address_type = "EXTERNAL"
  region       = var.region
}

resource "google_compute_router_nat" "nat" {
  name                   = var.vpc_nat_name
  router                 = google_compute_router.cloud_router.name
  region                 = google_compute_router.cloud_router.region
  nat_ip_allocate_option = "MANUAL_ONLY"
  nat_ips                = google_compute_address.static.*.self_link

  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
