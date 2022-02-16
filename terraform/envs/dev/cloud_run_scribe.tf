resource "google_cloud_run_service" "scribe" {
  name     = var.scribe_service_name
  location = var.region

  autogenerate_revision_name = false

  template {
    metadata {
      name = var.scribe_revision_name

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
        image = var.scribe_image

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


resource "google_cloud_run_service_iam_member" "scribe_all_users" {
  service  = google_cloud_run_service.scribe.name
  location = google_cloud_run_service.scribe.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
