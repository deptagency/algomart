# This defaults to marking all variables as sensitive solely for the
# reason that highest security, rather than lowest, should be the default condition.
#
# That is, a user should have to choose which *are not* sensitive,
# rather than which *are*.

variable "project" {
  sensitive = true
}

variable "region" {
  default   = "us-east4"
  sensitive = true
}

variable "bucket_location" {
  # This specifies multi-region but could be single eg. "US-EAST4".
  # Once created it cannot be changed.
  default   = "US"
  sensitive = true
}

# The service account credentials for terraform
variable "credentials" {
  sensitive = true
}

variable "disable_apis_on_destroy" {
  default   = false
  sensitive = true
}

##
## Service names
##
## These are parameterized just in case there are existing services within a project
## that can potentially have conflicting names.
##

variable "api_service_name" {
  default   = "algomart-api"
  sensitive = true
}

variable "cms_service_name" {
  default   = "algomart-cms"
  sensitive = true
}

variable "database_server_name" {
  default   = "algomart"
  sensitive = true
}

variable "private_ip_name" {
  default   = "algomart-private-ip"
  sensitive = true
}

variable "vpc_name" {
  default   = "algomart-vpc"
  sensitive = true
}

variable "vpc_access_connector_name" {
  # Limited to <= 24 characters
  default   = "algomart-access-conn"
  sensitive = true
}

variable "web_service_name" {
  default   = "algomart-web"
  sensitive = true
}

##
## Database
##
variable "database_server_tier" {
  default   = "db-f1-micro"
  sensitive = true
}

variable "database_max_connections" {
  # Cloud SQL defaults to 25 for db-f1-micro but this causes frequent issues like
  # "remaining connection slots reserved for superuser" errors.
  #
  # There are consistently 4 cloudsqladmin connections (6 are reserved),
  # and the CMS can have 4+ connections and the API 14+ at a time, which
  # leaves very little room for the fluctuating connections with background
  # API tasks.
  default   = 50
  sensitive = true
}

##
## API service
##

variable "algod_host" {
  sensitive = true
}

variable "algod_key" {
  sensitive = true
}

variable "algod_port" {
  sensitive = true
}

variable "api_creator_passphrase" {
  sensitive = true
}

variable "api_database_name" {
  default   = "algorand_marketplace_api"
  sensitive = true
}

variable "api_database_schema" {
  default   = "public"
  sensitive = true
}

variable "api_database_user_name" {
  sensitive = true
}

variable "api_database_user_password" {
  sensitive = true
}

variable "api_domain_mapping" {
  sensitive = true
}

variable "api_funding_mnemonic" {
  sensitive = true
}

variable "api_image" {
  sensitive = true
}

variable "api_key" {
  sensitive = true
}

variable "api_node_env" {
  default   = "production"
  sensitive = true
}

variable "api_revision_name" {
  sensitive = true
}

variable "api_secret" {
  sensitive = true
}

variable "circle_key" {
  sensitive = true
}

variable "circle_url" {
  sensitive = true
}

variable "sendgrid_key" {
  sensitive = true
}

variable "sendgrid_from_email" {
  sensitive = true
}

##
## CMS service
##

# Directus will use these to create an "admin" user automatically
variable "cms_admin_email" {
  sensitive = true
}

variable "cms_admin_password" {
  sensitive = true
}

variable "cms_database_name" {
  default   = "algorand_marketplace_cms"
  sensitive = true
}

variable "cms_database_user_name" {
  sensitive = true
}

variable "cms_database_user_password" {
  sensitive = true
}

variable "cms_domain_mapping" {
  sensitive = true
}

variable "cms_image" {
  sensitive = true
}

variable "cms_key" {
  sensitive = true
}

variable "cms_node_env" {
  default   = "production"
  sensitive = true
}

variable "cms_revision_name" {
  sensitive = true
}

variable "cms_secret" {
  sensitive = true
}

variable "cms_storage_bucket" {
  sensitive = true
}

##
## Web service
##

variable "web_domain_mapping" {
  sensitive = true
}

variable "web_firebase_service_account" {
  sensitive = true
}

variable "web_image" {
  sensitive = true
}

variable "web_next_public_3js_debug" {
  default   = ""
  sensitive = true
}

variable "web_next_public_firebase_config" {
  sensitive = true
}

variable "web_node_env" {
  default   = "production"
  sensitive = true
}

variable "web_revision_name" {
  sensitive = true
}
