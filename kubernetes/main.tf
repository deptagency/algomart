module "gke" {
  source                     = "terraform-google-modules/kubernetes-engine/google"
  project_id                 = var.project_id
  region                     = var.region
  zones                      = var.zones
  name                       = var.name
  network                    = google_compute_network.vpc.name
  subnetwork                 = google_compute_network.vpc.name
  ip_range_pods              = ""
  ip_range_services          = ""
  http_load_balancing        = true
  horizontal_pod_autoscaling = true
  network_policy             = true
  kubernetes_version         = "1.21.5-gke.1302"
  remove_default_node_pool   = true
  create_service_account     = false
  regional                   = true

  node_pools = [
    {
      name               = "default-node-pool"
      machine_type       = var.machine_type
      min_count          = var.min_count
      max_count          = var.max_count
      disk_size_gb       = var.disk_size_gb
      disk_type          = "pd-standard"
      image_type         = "COS"
      auto_repair        = true
      auto_upgrade       = true
      //service_account    = var.service_account
      //preemptible        = false
      initial_node_count = var.initial_node_count
    },
  ]

  node_pools_oauth_scopes = {
    all = []
    default-node-pool = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/ndev.clouddns.readwrite",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/trace.append",
    ]
  }

  node_pools_labels = {
    all = {}
    default-node-pool = {
      default-node-pool = true,
    }
  }

  node_pools_tags = {
    all = []
    default-node-pool = [
      "default-node-pool",
    ]
  }
}