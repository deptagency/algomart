resource "google_cloud_run_service" "api" {
  name     = var.api_service_name
  location = var.region

  autogenerate_revision_name = false

  template {
    metadata {
      name = var.api_revision_name

      annotations = {
        "run.googleapis.com/vpc-access-connector" = var.vpc_access_connector_name

        "run.googleapis.com/vpc-access-egress" = "all"

        # Limit the Web to run a single instance at all times
        # This may need to be tweaked to improve performance on a per-project basis
        "autoscaling.knative.dev/minScale" = 1
        "autoscaling.knative.dev/maxScale" = 1
      }
    }

    spec {
      containers {
        image = var.api_image

        env {
          name  = "ALGOD_ENV"
          value = var.algod_env
        }

        env {
          name  = "ALGOD_SERVER"
          value = var.algod_host
        }

        env {
          name  = "ALGOD_PORT"
          value = var.algod_port
        }

        env {
          name  = "ALGOD_TOKEN"
          value = var.algod_key
        }

        env {
          name  = "API_KEY"
          value = var.api_key
        }

        env {
          name  = "CIRCLE_API_KEY"
          value = var.circle_key
        }
        env {
          name  = "CIRCLE_URL"
          value = var.circle_url
        }

        env {
          name  = "CMS_ACCESS_TOKEN"
          value = var.cms_key
        }

        env {
          name  = "CMS_URL"
          value = "https://${var.cms_domain_mapping}"
        }

        env {
          name  = "CREATOR_PASSPHRASE"
          value = var.api_creator_passphrase
        }

        env {
          name  = "CUSTOMER_SERVICE_EMAIL"
          value = var.customer_service_email
        }

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.api_user.name}:${google_sql_user.api_user.password}@${google_sql_database_instance.database_server.private_ip_address}:5432/${google_sql_database.api_database.name}"
        }

        env {
          name  = "DATABASE_SCHEMA"
          value = var.api_database_schema
        }

        env {
          name  = "FUNDING_MNEMONIC"
          value = var.api_funding_mnemonic
        }

        env {
          name  = "HOST"
          value = "0.0.0.0"
        }

        env {
          name  = "NODE_ENV"
          value = var.api_node_env
        }

        env {
          name  = "SECRET"
          value = var.api_secret
        }

        env {
          name  = "PINATA_API_KEY"
          value = var.pinata_api_key
        }

        env {
          name  = "PINATA_API_SECRET"
          value = var.pinata_api_secret
        }

        env {
          name  = "SENDGRID_API_KEY"
          value = var.sendgrid_api_key
        }

        env {
          name  = "EMAIL_FROM"
          value = var.email_from
        }

        env {
          name  = "EMAIL_TRANSPORT"
          value = var.email_transport
        }

        env {
          name  = "EMAIL_NAME"
          value = var.email_name
        }

        env {
          name  = "SMTP_HOST"
          value = var.smtp_host
        }

        env {
          name  = "SMTP_PORT"
          value = var.smtp_port
        }

        env {
          name  = "SMTP_USER"
          value = var.smtp_user
        }

        env {
          name  = "SMTP_PASSWORD"
          value = var.smtp_password
        }

        env {
          name  = "WEB_URL"
          value = "https://${var.web_domain_mapping}"
        }

        env {
          name  = "LOG_LEVEL"
          value = "info"
        }

        env {
          name  = "GCP_CDN_URL"
          value = var.gcp_cdn_url
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

resource "google_cloud_run_domain_mapping" "api" {
  location = var.region
  name     = var.api_domain_mapping

  metadata {
    namespace = var.project
  }

  spec {
    route_name = google_cloud_run_service.api.name
  }
}

resource "google_cloud_run_service_iam_member" "api_all_users" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
