resource "google_cloud_run_service" "web" {
  name     = var.web_service_name
  location = var.region

  autogenerate_revision_name = false

  template {
    metadata {
      name = var.web_revision_name
    }

    spec {
      containers {
        image = var.web_image

        env {
          name  = "API_KEY"
          value = var.api_key
        }

        env {
          name  = "API_URL"
          value = "https://${var.api_domain_mapping}"
        }

        env {
          name  = "FIREBASE_SERVICE_ACCOUNT"
          value = var.web_firebase_service_account
        }

        env {
          name  = "IMAGE_DOMAINS"
          value = "lh3.googleusercontent.com,firebasestorage.googleapis.com,${var.cms_domain_mapping}"
        }

        env {
          name  = "NEXT_PUBLIC_3JS_DEBUG"
          value = var.web_next_public_3js_debug
        }

        env {
          name  = "NEXT_PUBLIC_FIREBASE_CONFIG"
          value = var.web_next_public_firebase_config
        }

        env {
          name  = "NODE_ENV"
          value = var.web_node_env
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.run_api,
  ]
}

resource "google_cloud_run_domain_mapping" "web" {
  location = var.region
  name     = var.web_domain_mapping

  metadata {
    namespace = var.project
  }

  spec {
    route_name = google_cloud_run_service.web.name
  }
}

resource "google_cloud_run_service_iam_member" "web_all_users" {
  service  = google_cloud_run_service.web.name
  location = google_cloud_run_service.web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
