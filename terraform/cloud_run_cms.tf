resource "google_storage_bucket" "cms_bucket" {
  name     = var.cms_storage_bucket
  project  = var.project
  location = var.bucket_location

  uniform_bucket_level_access = true

  // Require all objects to be manually deleted prior to bucket removal
  force_destroy = false
}

resource "google_cloud_run_service" "cms" {
  name     = var.cms_service_name
  location = var.region

  autogenerate_revision_name = false

  template {
    metadata {
      name = var.cms_revision_name

      annotations = {
        "run.googleapis.com/vpc-access-connector" = var.vpc_access_connector_name

        # maxScale to limit database connections; it is unlikely that there
        # will ever be more than a single container running
        "autoscaling.knative.dev/maxScale" = 2
      }
    }

    spec {
      containers {
        image = var.cms_image

        env {
          name  = "ADMIN_EMAIL"
          value = var.cms_admin_email
        }

        env {
          name  = "ADMIN_PASSWORD"
          value = var.cms_admin_password
        }

        # Directus supports a `DB_CONNECTION_STRING` env var that takes precedence over these,
        # but even with that variable set Directus will error without these set as well
        env {
          name  = "DB_CLIENT"
          value = "postgres"
        }

        env {
          name  = "DB_HOST"
          value = google_sql_database_instance.database_server.private_ip_address
        }

        env {
          name  = "DB_PORT"
          value = 5432
        }

        env {
          name  = "DB_DATABASE"
          value = google_sql_database.cms_database.name
        }

        env {
          name  = "DB_USER"
          value = google_sql_user.cms_user.name
        }

        env {
          name  = "DB_PASSWORD"
          value = google_sql_user.cms_user.password
        }

        env {
          name  = "KEY"
          value = var.cms_key
        }

        env {
          name  = "HOST"
          value = "0.0.0.0"
        }

        env {
          name  = "NODE_ENV"
          value = var.cms_node_env
        }

        env {
          name  = "PUBLIC_URL"
          value = "https://${var.cms_domain_mapping}"
        }

        env {
          name  = "SECRET"
          value = var.cms_secret
        }

        # The "locations" value is a comma-separate string of arbitrary values.
        # Directus doesn't expect any specific value(s); instead, it uses those
        # locations to look for other environment variables.
        #
        # With a value of "google" it looks for `STORAGE_GOOGLE_DRIVER`, etc.
        # but with a value of "gcp" it would look for `STORAGE_GCP_DRIVER`, etc.
        # Likewise, with a value of "gcp,aws" it would configure 2 storage drivers
        # and look for `STORAGE_GCP_DRIVER` and `STORAGE_AWS_DRIVER`.
        #
        # The values of *those* environment variables, however, are not arbitrary.
        env {
          name  = "STORAGE_LOCATIONS"
          value = "gcp"
        }

        env {
          name  = "STORAGE_GCP_DRIVER"
          value = "gcs"
        }

        env {
          name  = "STORAGE_GCP_BUCKET"
          value = google_storage_bucket.cms_bucket.name
        }

        env {
          name  = "STORAGE_GCP_CREDENTIALS"
          value = var.credentials
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
    google_project_service.vpcaccess_api,
    google_vpc_access_connector.connector,
  ]
}

resource "google_cloud_run_domain_mapping" "cms" {
  location = var.region
  name     = var.cms_domain_mapping

  metadata {
    namespace = var.project
  }

  spec {
    route_name = google_cloud_run_service.cms.name
  }
}

resource "google_cloud_run_service_iam_member" "cms_all_users" {
  service  = google_cloud_run_service.cms.name
  location = google_cloud_run_service.cms.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
