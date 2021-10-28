variable "project" {}

variable "region" {
  default = "us-east4"
}

variable "bucket_location" {
  # This specifies multi-region but could be single eg. "US-EAST4".
  # Once created it cannot be changed.
  default = "US"
}

# The service account credentials for terraform
variable "credentials" {}

variable "disable_apis_on_destroy" {
  default = false
}

##
## Service names
##
## These are parameterized just in case there are existing services within a project
## that can potentially have conflicting names.
##

variable "api_service_name" {
  default = "algomart-api"
}

variable "cms_service_name" {
  default = "algomart-cms"
}

variable "database_server_name" {
  default = "algomart"
}

variable "private_ip_name" {
  default = "algomart-private-ip"
}

variable "vpc_name" {
  default = "algomart-vpc"
}

variable "vpc_access_connector_name" {
  # Limited to <= 24 characters
  default = "algomart-access-conn"
}

variable "web_service_name" {
  default = "algomart-web"
}

##
## Database
##
variable "database_server_tier" {
  default = "db-f1-micro"
}

variable "database_max_connections" {
  # Cloud SQL defaults to 25 for db-f1-micro but this causes frequent issues like
  # "remaining connection slots reserved for superuser" errors.
  #
  # There are consistently 4 cloudsqladmin connections (6 are reserved),
  # and the CMS can have 4+ connections and the API 14+ at a time, which
  # leaves very little room for the fluctuating connections with background
  # API tasks.
  default = 50
}

##
## API service
##

variable "algod_host" {}

variable "algod_key" {}

variable "algod_port" {}

variable "api_creator_passphrase" {}

variable "api_database_name" {
  default = "algorand_marketplace_api"
}

variable "api_database_schema" {
  default = "public"
}

variable "api_database_user_name" {}

variable "api_database_user_password" {}

variable "api_domain_mapping" {}

variable "api_funding_mnemonic" {}

variable "api_image" {}

variable "api_key" {}

variable "api_node_env" {
  default = "production"
}

variable "api_revision_name" {}

variable "api_secret" {}

variable "circle_key" {}

variable "circle_url" {}

variable "sendgrid_key" {}

variable "sendgrid_from_email" {}

##
## CMS service
##

# Directus will use these to create an "admin" user automatically
variable "cms_admin_email" {}

variable "cms_admin_password" {}

variable "cms_database_name" {
  default = "algorand_marketplace_cms"
}

variable "cms_database_user_name" {}

variable "cms_database_user_password" {}

variable "cms_domain_mapping" {}

# The CMS docker image on GCR
variable "cms_image" {}

variable "cms_key" {}

variable "cms_node_env" {
  default = "production"
}

variable "cms_revision_name" {}

variable "cms_secret" {}

variable "cms_storage_bucket" {}

##
## Web service
##

variable "web_domain_mapping" {}

variable "web_firebase_service_account" {}

variable "web_image" {}

variable "web_next_public_3js_debug" {
  default = ""
}

variable "web_next_public_firebase_config" {}

variable "web_node_env" {
  default = "production"
}

variable "web_revision_name" {}
