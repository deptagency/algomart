resource "random_string" "db_suffix" {
  length = 6
  special = false 
  number = false
  upper = false
  lower = true
}

resource "google_sql_database_instance" "database_server" {
  name             = "${var.database_server_name}-${random_string.db_suffix.result}"
  database_version = "POSTGRES_13"
  region           = var.region
/*
  lifecycle {
    prevent_destroy = true
  }
*/
  settings {
    tier = var.database_server_tier

    ip_configuration {
      private_network = google_compute_network.vpc.id
    }

    database_flags {
      name  = "max_connections"
      value = var.database_max_connections
    }
  }

  depends_on = [
    //google_project_service.sql_api,
    google_service_networking_connection.vpc_conn,
  ]
}

resource "google_sql_database" "api_database" {
  name     = data.google_secret_manager_secret_version.api_database_name.secret_data
  instance = google_sql_database_instance.database_server.name

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    google_sql_database_instance.database_server
  ]
}

resource "google_sql_database" "cms_database" {
  name     = var.cms_database_name
  instance = google_sql_database_instance.database_server.name

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    google_sql_database_instance.database_server
  ]
}

resource "google_sql_user" "api_user" {
  instance = google_sql_database_instance.database_server.name
  name     = data.google_secret_manager_secret_version.api_database_user_name.secret_data
  password = data.google_secret_manager_secret_version.api_database_user_password.secret_data

  depends_on = [
    google_sql_database.api_database
  ]
}

resource "google_sql_user" "cms_user" {
  instance = google_sql_database_instance.database_server.name
  name     = data.google_secret_manager_secret_version.cms_database_user_name.secret_data
  password = data.google_secret_manager_secret_version.cms_database_user_password.secret_data

  depends_on = [
    google_sql_database.cms_database
  ]
}
