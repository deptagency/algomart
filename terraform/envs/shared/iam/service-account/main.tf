locals {
  service_account_email = google_service_account.this.email
  service_account_fqn = "serviceAccount:${local.service_account_email}"
}

resource "google_service_account" "this" {
  account_id   = var.name
  display_name = var.display_name
}

resource "google_project_iam_member" "role_binding" {
  for_each = toset(var.roles)

  project = var.project_id
  member = local.service_account_fqn
  role = each.value
}