/*
variable "credentials" {
  type        = string
  description = "Location of the credential keyfile."
}
*/
variable "project_id" {
  type        = string
  description = "The project ID to create the cluster."
  default     = "qam-project-331620"
}

variable "region" {
  type        = string
  description = "The region to create the cluster."
  default     = "us-east1"
}

variable "zones" {
  type        = list(string)
  description = "The zones to create the cluster."
  default     = ["us-east1-b","us-east1-c","us-east1-d"]
}

variable "name" {
  type        = string
  description = "The name of the cluster."
  default     = "gke-test-2"
}

variable "machine_type" {
  type        = string
  description = "Type of the node compute engines."
  default     = "n1-standard-1"
}

variable "min_count" {
  type        = number
  description = "Minimum number of nodes in the NodePool. Must be >=0 and <= max_node_count."
  default     = 1
}

variable "max_count" {
  type        = number
  description = "Maximum number of nodes in the NodePool. Must be >= min_node_count."
  default     = 3
}

variable "disk_size_gb" {
  type        = number
  description = "Size of the node's disk."
  default     = 100
}
/*
variable "service_account" {
  type        = string
  description = "The service account to run nodes as if not overridden in `node_pools`. The create_service_account variable default value (true) will cause a cluster-specific service account to be created."

}
*/
variable "initial_node_count" {
  type        = number
  description = "The number of nodes to create in this cluster's default node pool."
  default     = 1
}

variable "private_ip_name" {
  default   = "algomart-private-ip-2"
  sensitive = true
}

variable "vpc_name" {
  default   = "algomart-vpc-2"
  sensitive = true
}

variable "database_server_name" {
  default   = "algomart"
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

variable "cms_database_name" {
  default   = "algorand_marketplace_cms"
  sensitive = true
}

variable "web_next_public_3js_debug" {
  default   = ""
  sensitive = true
}

variable "bucket_location" {
  default   = "US"
  sensitive = true
}

variable "web_node_env" {
  default   = "production"
  sensitive = true
}

variable "cms_node_env" {
  default   = "production"
  sensitive = true
}

variable "api_node_env" {
  default   = "production"
  sensitive = true
}