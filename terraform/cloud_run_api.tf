resource "google_cloud_run_service" "api" {
  name     = var.api_service_name
  location = var.region

  autogenerate_revision_name = false

  template {
    metadata {
      name = var.api_revision_name

      annotations = {
        "run.googleapis.com/vpc-access-connector" = var.vpc_access_connector_name

        # BETA FEATURE
        #
        # Cloud Run by default will throttle CPU resources to near zero while a
        # container is not actively responding to requests, meaning any background
        # work will be suspended.
        #
        # This allows active containers to receive CPU time even when not responding
        # to requests, allowing for background task execution. This WILL NOT keep
        # containers around indefinitely; it only sets them to receive CPU time
        # until Cloud Run shuts them down some time after not receiving requests.
        #
        # See: https://cloud.google.com/run/docs/configuring/cpu-allocation
        "run.googleapis.com/cpu-throttling" = "false"

        # By default, Cloud Run will shut down containers after some amount of
        # time not receiving requests (maximum of 15 minutes). A new container
        # will immediately be started when a new request is received, but the
        # resulting cold start time can be unreasonable and lead to time outs,
        # primarily because of knex checking for migrations to run.
        #
        # Setting "minimum_instances" to 1 (or more) will force Cloud Run
        # to always keep that number of containers on-hand to avoid the
        # cold starts. Those containers will not receive CPU time when idle,
        # however; for that, see "always-on CPU allocation".
        "autoscaling.knative.dev/minScale" = 1

        # TODO
        #
        # maxScale is very conservative due to background tasks not needing
        # to scale up (and opening up unnecessary connection pools) and
        # fastify being highly capable of handling a decent amount of traffic.
        "autoscaling.knative.dev/maxScale" = 2
      }
    }

    spec {
      containers {
        image = var.api_image

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
          name  = "SENDGRID_API_KEY"
          value = var.sendgrid_key
        }

        env {
          name  = "SENDGRID_FROM_EMAIL"
          value = var.sendgrid_from_email
        }

        env {
          name  = "WEB_URL"
          value = "https://${var.web_domain_mapping}"
        }

        env {
          name  = "LOG_LEVEL"
          value = "debug"
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
