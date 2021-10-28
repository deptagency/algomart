# Example values for the required input variables.
#
# These can be supplied as environment variables like `TF_VAR_algod_host=<host>`,
# `TF_VAR_api_key=<key>`, etc.
#
# Otherwise, this file can be copied to `terraform.tfvars` & populated with values,
# and terraform will load it automatically.
algod_host                 = "algo.nfty.example.com"
algod_key                  = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
algod_port                 = "443"
api_creator_passphrase     = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
api_database_user_name     = "api"
api_database_user_password = "password"
api_domain_mapping         = "api.nfty.example.com"
api_funding_mnemonic       = "rice loop spare [... 22 more words]"
api_image                  = "gcr.io/<gcp-project-id>/api:a1b2c3d4"
api_key                    = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
api_secret                 = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
circle_key                 = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
circle_url                 = "https://api-sandbox.circle.com"
cms_admin_email            = "admin@nfty.example.com"
cms_admin_password         = "password"
cms_database_user_name     = "cms"
cms_database_user_password = "password"
cms_domain_mapping         = "cms.nfty.example.com"
cms_image                  = "gcr.io/<gcp-project-id>/cms:a1b2c3d4"
cms_key                    = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
cms_secret                 = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
cms_storage_bucket         = "some-bucket-name"
project                    = "<gcp-project-id>"
sendgrid_key               = "a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4a1b2c3d4"
sendgrid_from_email        = "admin@nfty.example.com"
web_domain_mapping         = "nfty.example.com"
web_image                  = "gcr.io/<gcp-project-id>/web:a1b2c3d4"

# The GCP service account JSON needs to actually be read from the file;
# this cannot just be the filename, and all properties MUST BE NEWLINE-DELIMITED.

# Example:
#
#   {
#     "type": "service_account",
#     "project_id": "<gcp-project-id>",
#     "private_key_id": "ac4..snip...8ac",
#     "private_key": "-----BEGIN PRIVATE KEY-----\nABC ... snip ... XYZ\n-----END PRIVATE KEY-----\n",
#     "client_email": "<user>@<gcp-project-id>.iam.gserviceaccount.com",
#     "client_id": "123... snip ...789",
#     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
#     "token_uri": "https://oauth2.googleapis.com/token",
#     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
#     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/<user>%40<gcp-project-id>.iam.gserviceaccount.com"
#   }
credentials = file("gcp-service-account.json")

# These Firebase JSON values can be inlined or read from a file, and unlike the GCP
# service account the properties DO NOT need to be newline-delimited.
#
# Example:
#
#   {
#     "clientEmail": "<user>@<project>.iam.gserviceaccount.com",
#     "privateKey": "-----BEGIN PRIVATE KEY-----\nABC... snip ...XYZ\n-----END PRIVATE KEY-----\n",
#     "projectId": ""
#   }
web-firebase-service-account = file("firebase-service-account.json")

# Example:
#
#   {
#     "apiKey": "abc... snip ...xyz"
#     "appId": "123... snip ...789",
#     "authDomain": "auth.nfty.example.com",
#     "measurementId": "A-ASDFQWERZX",
#     "messagingSenderId": "1234567890",
#     "projectId": "<project-id>",
#     "storageBucket": "<bucket-name>"
#   }
web_next_public_firebase_config = file("firebase-config.json")
