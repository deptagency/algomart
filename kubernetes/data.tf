data "google_secret_manager_secret_version" "algod_host" {
  secret = "algod_host"
}

data "google_secret_manager_secret_version" "algod_key" {
  secret = "algod_key"
}

data "google_secret_manager_secret_version" "algod_port" {
  secret = "algod_port"
}

data "google_secret_manager_secret_version" "api_creator_passphrase" {
  secret = "api_creator_passphrase"
}

data "google_secret_manager_secret_version" "api_database_name" {
  secret = "api_database_name"
}

data "google_secret_manager_secret_version" "api_database_schema" {
  secret = "api_database_schema"
}

data "google_secret_manager_secret_version" "api_database_user_name" {
  secret = "api_database_user_name"
}

data "google_secret_manager_secret_version" "api_database_user_password" {
  secret = "api_database_user_password"
}

data "google_secret_manager_secret_version" "api_funding_mnemonic" {
  secret = "api_funding_mnemonic"
}

data "google_secret_manager_secret_version" "api_key" {
  secret = "api_key"
}

data "google_secret_manager_secret_version" "api_secret" {
  secret = "api_secret"
}

data "google_secret_manager_secret_version" "circle_key" {
  secret = "circle_key"
}

data "google_secret_manager_secret_version" "circle_url" {
  secret = "circle_url"
}

data "google_secret_manager_secret_version" "cms_admin_email" {
  secret = "cms_admin_email"
}

data "google_secret_manager_secret_version" "cms_admin_password" {
  secret = "cms_admin_password"
}

data "google_secret_manager_secret_version" "cms_database_user_name" {
  secret = "cms_database_user_name"
}

data "google_secret_manager_secret_version" "cms_database_user_password" {
  secret = "cms_database_user_password"
}

data "google_secret_manager_secret_version" "cms_key" {
  secret = "cms_key"
}

data "google_secret_manager_secret_version" "cms_secret" {
  secret = "cms_secret"
}

data "google_secret_manager_secret_version" "cms_storage_bucket" {
  secret = "cms_storage_bucket"
  version = 1
}

data "google_secret_manager_secret_version" "sendgrid_key" {
  secret = "sendgrid_key"
}

data "google_secret_manager_secret_version" "sendgrid_from_email" {
  secret = "sendgrid_from_email"
}

data "google_secret_manager_secret_version" "web_next_public_firebase_config" {
  secret = "web_next_public_firebase_config"
}

data "google_secret_manager_secret_version" "web_firebase_service_account" {
  secret = "web_firebase_service_account"
}

data "google_secret_manager_secret_version" "credentials" {
  secret = "credentials"
}

data "google_secret_manager_secret_version" "api_domain_mapping" {
  secret = "api_domain_mapping"
}

data "google_secret_manager_secret_version" "cms_domain_mapping" {
  secret = "cms_domain_mapping"
}

data "google_secret_manager_secret_version" "web_domain_mapping" {
  secret = "web_domain_mapping"
}

data "google_secret_manager_secret_version" "web_crt" {
  secret = "web_crt"
}

data "google_secret_manager_secret_version" "web_private_key" {
  secret = "web_private_key"
}

data "google_secret_manager_secret_version" "cms_crt" {
  secret = "cms_crt"
}

data "google_secret_manager_secret_version" "cms_private_key" {
  secret = "cms_private_key"
}

data "google_secret_manager_secret_version" "api_crt" {
  secret = "api_crt"
}

data "google_secret_manager_secret_version" "api_private_key" {
  secret = "api_private_key"
}
