########################VPC#########################
# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# These variables are expected to be passed in by the operator
# ---------------------------------------------------------------------------------------------------------------------

variable "name_prefix" {
  description = "A name prefix used in resource names to ensure uniqueness across a project."
  type        = string
  default     = "test"
}

# ---------------------------------------------------------------------------------------------------------------------
# OPTIONAL PARAMETERS
# Generally, these values won't need to be changed.
# ---------------------------------------------------------------------------------------------------------------------

variable "cidr_block" {
  description = "The IP address range of the VPC in CIDR notation. A prefix of /16 is recommended. Do not use a prefix higher than /27."
  default     = "10.0.0.0/16"
  type        = string
}

variable "cidr_subnetwork_width_delta" {
  description = "The difference between your network and subnetwork netmask; an /16 network and a /20 subnetwork would be 4."
  type        = number
  default     = 4
}

variable "cidr_subnetwork_spacing" {
  description = "How many subnetwork-mask sized spaces to leave between each subnetwork type."
  type        = number
  default     = 0
}

variable "public_subnetwork_secondary_range_name" {
  description = "The name associated with the pod subnetwork secondary range, used when adding an alias IP range to a VM instance. The name must be 1-63 characters long, and comply with RFC1035. The name must be unique within the subnetwork."
  type        = string
  default     = "public-cluster"
}

variable "public_services_secondary_range_name" {
  description = "The name associated with the services subnetwork secondary range, used when adding an alias IP range to a VM instance. The name must be 1-63 characters long, and comply with RFC1035. The name must be unique within the subnetwork."
  type        = string
  default     = "public-services"
}

variable "secondary_cidr_block" {
  description = "The IP address range of the VPC's secondary address range in CIDR notation. A prefix of /16 is recommended. Do not use a prefix higher than /27."
  type        = string
  default     = "10.1.0.0/16"
}

variable "public_services_secondary_cidr_block" {
  description = "The IP address range of the VPC's public services secondary address range in CIDR notation. A prefix of /16 is recommended. Do not use a prefix higher than /27. Note: this variable is optional and is used primarily for backwards compatibility, if not specified a range will be calculated using var.secondary_cidr_block, var.secondary_cidr_subnetwork_width_delta and var.secondary_cidr_subnetwork_spacing."
  type        = string
  default     = null
}

variable "private_services_secondary_cidr_block" {
  description = "The IP address range of the VPC's private services secondary address range in CIDR notation. A prefix of /16 is recommended. Do not use a prefix higher than /27. Note: this variable is optional and is used primarily for backwards compatibility, if not specified a range will be calculated using var.secondary_cidr_block, var.secondary_cidr_subnetwork_width_delta and var.secondary_cidr_subnetwork_spacing."
  type        = string
  default     = null
}

variable "secondary_cidr_subnetwork_width_delta" {
  description = "The difference between your network and subnetwork's secondary range netmask; an /16 network and a /20 subnetwork would be 4."
  type        = number
  default     = 4
}

variable "secondary_cidr_subnetwork_spacing" {
  description = "How many subnetwork-mask sized spaces to leave between each subnetwork type's secondary ranges."
  type        = number
  default     = 0
}

variable "log_config" {
  description = "The logging options for the subnetwork flow logs. Setting this value to `null` will disable them. See https://www.terraform.io/docs/providers/google/r/compute_subnetwork.html for more information and examples."
  type = object({
    aggregation_interval = string
    flow_sampling        = number
    metadata             = string
  })

  default = {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

variable "allowed_public_restricted_subnetworks" {
  default     = []
  type        = list(string)
}

############################gke#####################
variable "project" { default = "qam-project-331620"}
variable "region" { default = "us-east1" }
variable "zones" { default = ["us-east1-b","us-east1-c","us-east1-d"] }
variable "cluster_name" {default = "gke-test"}
variable "ip_range_pods" { default = "" }
variable "ip_range_services" { default = "" }
variable "kubernetes_version" { default = "1.21.5-gke.1302"}
variable "regional"  { default = true}
variable "create_service_account" { default  = false }
variable "remove_default_node_pool" { default= true}
variable "network_policy"   { default = false }
variable "horizontal_pod_autoscaling" { default= true}
variable "http_load_balancing"        {default= true}
variable node_pool_name { default = "default-node-pool"}
variable machine_type    { default= "n1-standard-1"}
variable min_count          {default= 1}
variable max_count          {default= 3}
variable local_ssd_count    {default= 0}
variable disk_size_gb       {default= 100}
variable disk_type          {default= "pd-standard"}
variable image_type         {default= "COS"}
variable auto_repair        {default= true}
variable auto_upgrade       {default= true}
variable initial_node_count { default = 1}
variable credentials        { default = ""}
variable "bucket_location" {
  default   = "US"
  sensitive = true
}
variable "api_node_env" {
  default   = "production"
  sensitive = true
}
variable "cms_node_env" {
  default   = "production"
  sensitive = true
}
variable "database_server_tier" {
  default   = "db-f1-micro"
  sensitive = true
}
variable "database_max_connections" {
  default   = 50
  sensitive = true
}
variable "database_server_name" {
  default   = "algomart"
  sensitive = true
}
variable "api_database_name" {
  default   = "algorand_marketplace_api"
  sensitive = true
}
variable "cms_database_name" {
  default   = "algorand_marketplace_cms"
  sensitive = true
}
variable "api_database_user_name" {
  sensitive = true
  default = "api"
}
variable "api_database_user_password" {
  sensitive = true
  default = "password"
}
variable "cms_database_user_name" {
  sensitive = true
  default = "cms"
}
variable "cms_database_user_password" {
  sensitive = true
  default = "password"
}
variable "private_ip_name" {
  default   = "algomart-private-ip"
  sensitive = true
}
variable "web_next_public_3js_debug" {
  default   = ""
  sensitive = true
}

variable "web_node_env" {
  default   = "production"
  sensitive = true
}

##################################################

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