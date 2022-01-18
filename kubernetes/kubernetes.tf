resource "kubernetes_namespace_v1" "algomart-namespace" {
  metadata {
    name = "algomart"
  }
}

resource "kubernetes_config_map_v1" "configMap" {
  metadata {
    name = "algomart-web-config"
    namespace = "algomart"
  }

  data = {
    "firebase-service-account.json" = "${data.google_secret_manager_secret_version.web_firebase_service_account.secret_data}"
    "firebase-config.json"          = "${data.google_secret_manager_secret_version.web_next_public_firebase_config.secret_data}"
    "credentials.json"              = "${data.google_secret_manager_secret_version.credentials.secret_data}"
  }
}

resource "kubernetes_deployment_v1" "web_service" {
    metadata {
        name        = "algomart-web"
        namespace   = "algomart"
    }

    spec {
        replicas = 3

        selector {
            match_labels = {
                app = "algomart-web"
            }
        }

        template {
            metadata {
                labels = {
                    app = "algomart-web"
                }
            }

            spec {
                container {
                    image = "us-east4-docker.pkg.dev/qam-project-331620/algomart/web:e856485"
                    name  = "algomart-web"
                    port  {
                        container_port = 3000
                    }
                    env {
                        name    = "API_KEY"
                        value   = data.google_secret_manager_secret_version.api_key.secret_data
                    }
                    env {
                        name    = "API_URL"
                        value   = "https://${data.google_secret_manager_secret_version.api_domain_mapping.secret_data}"
                    }
                    env {
                        name    = "IMAGE_DOMAINS"
                        value   = "lh3.googleusercontent.com,firebasestorage.googleapis.com,${data.google_secret_manager_secret_version.cms_domain_mapping.secret_data}"
                    }
                    env {
                        name    = "NEXT_PUBLIC_3JS_DEBUG"
                        value   = var.web_next_public_3js_debug
                    }
                    env {  
                        name    = "NODE_ENV"
                        value   = var.web_node_env
                    }
                    env {
                        name    = "FIREBASE_SERVICE_ACCOUNT"
                        value_from {
                            config_map_key_ref {
                                name    = "algomart-web-config"
                                key     = "firebase-service-account.json"
                            }
                        }
                    }
                    env {
                        name    = "NEXT_PUBLIC_FIREBASE_CONFIG"
                        value_from {
                            config_map_key_ref {
                                name    = "algomart-web-config"
                                key     = "firebase-config.json"
                            }
                        }
                    }           
                }            
            }
        }
    }
}

resource "kubernetes_service_v1" "web_lb" {
    metadata {
        name        = "web-lb"
        namespace   = "algomart"
    }
    spec {
        selector = {
            app = kubernetes_deployment_v1.web_service.metadata.0.name
        }
        port {
            port        = 3000
            target_port = 3000
            protocol    = "TCP"
        }

        type = "LoadBalancer"
    }
}

resource "kubernetes_deployment_v1" "cms_service" {
    metadata {
        name        = "algomart-cms"
        namespace   = "algomart"
    }

    spec {
        replicas = 3

        selector {
            match_labels = {
                app = "algomart-cms"
            }
        }

        template {
            metadata {
                labels = {
                    app = "algomart-cms"
                }
            }

            spec {
                container {
                    image = "us-east4-docker.pkg.dev/qam-project-331620/algomart/cms:4e1fe2f"
                    name  = "algomart-cms"
                    port  {
                        container_port = 8055
                    }
                    env {
                        name    = "ADMIN_EMAIL"
                        value   = data.google_secret_manager_secret_version.cms_admin_email.secret_data
                    }
                    env {
                        name    = "ADMIN_PASSWORD"
                        value   = data.google_secret_manager_secret_version.cms_admin_password.secret_data
                    }
                    env {
                        name    = "DB_CLIENT"
                        value   = "postgres"
                    }
                    env {
                        name    = "DB_HOST"
                        value   = google_sql_database_instance.database_server.private_ip_address
                    }
                    env {
                        name    = "DB_PORT"
                        value   = 5432
                    }
                    env {  
                        name    = "DB_DATABASE"
                        value   = google_sql_database.cms_database.name
                    }
                    env {  
                        name    = "DB_USER"
                        value   = google_sql_user.cms_user.name
                    }
                    env {  
                        name    = "DB_PASSWORD"
                        value   = google_sql_user.cms_user.password
                    } 
                    env {  
                        name    = "KEY"
                        value   = data.google_secret_manager_secret_version.cms_key.secret_data
                    } 
                    env {  
                        name    = "HOST"
                        value   = "0.0.0.0"
                    } 
                    env {  
                        name    = "NODE_ENV"
                        value   = var.cms_node_env
                    } 
                    env {  
                        name    = "PUBLIC_URL"
                        value   = "https://${data.google_secret_manager_secret_version.cms_domain_mapping.secret_data}"
                    } 
                    env {  
                        name    = "SECRET"
                        value   = data.google_secret_manager_secret_version.cms_secret.secret_data
                    } 
                    env {  
                        name    = "STORAGE_LOCATIONS"
                        value   = "gcp"
                    } 
                    env {  
                        name    = "STORAGE_GCP_DRIVER"
                        value   = "gcs"
                    } 
                    env {  
                        name    = "STORAGE_GCP_BUCKET"
                        value   = google_storage_bucket.cms_bucket.name
                    }
                    env {
                        name    = "STORAGE_GCP_CREDENTIALS"
                        value_from {
                            config_map_key_ref {
                                name    = "algomart-web-config"
                                key     = "credentials.json"
                            }
                        }
                    }           
                }            
            }
        }
    }
}

resource "kubernetes_service_v1" "cms_lb" {
    metadata {
        name        = "cms-lb"
        namespace   = "algomart"
        annotations = {
           "cloud.google.com/backend-config" = "{\"default\" : \"cms-lb-backendconfig\"}"
        }
    }
    spec {
        selector = {
            app = kubernetes_deployment_v1.cms_service.metadata.0.name
        }
        port {
            port        = 8055
            target_port = 8055
            protocol    = "TCP"
        }

        type = "LoadBalancer"
    }
}

resource "kubernetes_deployment_v1" "api_service" {
    metadata {
        name        = "algomart-api"
        namespace   = "algomart"
    }

    spec {
        replicas = 3

        selector {
            match_labels = {
                app = "algomart-api"
            }
        }

        template {
            metadata {
                labels = {
                    app = "algomart-api"
                }
            }

            spec {
                container {
                    image = "us-east4-docker.pkg.dev/qam-project-331620/algomart/api:4e1fe2f"
                    name  = "algomart-api"
                    port  {
                        container_port = 8080
                    }
                    env {
                        name    = "ALGOD_SERVER"
                        value   = data.google_secret_manager_secret_version.algod_host.secret_data
                    }
                    env {
                        name    = "ALGOD_PORT"
                        value   = data.google_secret_manager_secret_version.algod_port.secret_data
                    }
                    env {
                        name    = "ALGOD_TOKEN"
                        value   = data.google_secret_manager_secret_version.algod_key.secret_data
                    }
                    env {
                        name    = "API_KEY"
                        value   = data.google_secret_manager_secret_version.api_key.secret_data
                    }
                    env {
                        name    = "CIRCLE_API_KEY"
                        value   = data.google_secret_manager_secret_version.circle_key.secret_data
                    }
                    env {  
                        name    = "CIRCLE_URL"
                        value   = data.google_secret_manager_secret_version.circle_url.secret_data
                    }
                    env {  
                        name    = "CMS_ACCESS_TOKEN"
                        value   = data.google_secret_manager_secret_version.cms_key.secret_data
                    }
                    env {  
                        name    = "CMS_URL"
                        value   = "https://${data.google_secret_manager_secret_version.cms_domain_mapping.secret_data}"
                    } 
                    env {  
                        name    = "CREATOR_PASSPHRASE"
                        value   = data.google_secret_manager_secret_version.api_creator_passphrase.secret_data
                    } 
                    env {  
                        name    = "DATABASE_URL"
                        value   = "postgresql://${google_sql_user.api_user.name}:${google_sql_user.api_user.password}@${google_sql_database_instance.database_server.private_ip_address}:5432/${google_sql_database.api_database.name}"
                    } 
                    env {  
                        name    = "DATABASE_SCHEMA"
                        value   = data.google_secret_manager_secret_version.api_database_schema.secret_data
                    } 
                    env {  
                        name    = "FUNDING_MNEMONIC"
                        value   = data.google_secret_manager_secret_version.api_funding_mnemonic.secret_data
                    } 
                    env {  
                        name    = "HOST"
                        value   = "0.0.0.0"
                    } 
                    env {  
                        name    = "PORT"
                        value   = "8080"
                    } 
                    env {  
                        name    = "NODE_ENV"
                        value   = var.api_node_env
                    } 
                    env {  
                        name    = "SECRET"
                        value   = data.google_secret_manager_secret_version.api_secret.secret_data
                    }
                    env {  
                        name    = "SENDGRID_API_KEY"
                        value   = data.google_secret_manager_secret_version.sendgrid_key.secret_data
                    }   
                    env {  
                        name    = "SENDGRID_FROM_EMAIL"
                        value   = data.google_secret_manager_secret_version.sendgrid_from_email.secret_data
                    }
                    env {  
                        name    = "WEB_URL"
                        value   = "https://${data.google_secret_manager_secret_version.web_domain_mapping.secret_data}"
                    }
                    env {  
                        name    = "LOG_LEVEL"
                        value   = "debug"
                    }
                    env {  
                        name    = "EMAIL_TRANSPORT"
                        value   = "sendgrid"
                    }
                    env {  
                        name    = "SMTP_PORT"
                        value   = 25
                    }        
                }            
            }
        }
    }
}

resource "kubernetes_service_v1" "api_lb" {
    metadata {
        name        = "api-lb"
        namespace   = "algomart"
        annotations = {
           "cloud.google.com/backend-config" = "{\"default\" : \"api-lb-backendconfig\"}"
        }
    }
    spec {
        selector = {
            app = kubernetes_deployment_v1.api_service.metadata.0.name
        }
        port {
            port        = 8080
            target_port = 8080
            protocol    = "TCP"
        }

        type = "LoadBalancer"
    }
}

resource "kubernetes_secret_v1" "web_cert" {
    metadata {
        name        = "web-cert"
        namespace   = "algomart"
    }

    binary_data = {
        "tls.crt" = data.google_secret_manager_secret_version.web_crt.secret_data
        "tls.key" = data.google_secret_manager_secret_version.web_private_key.secret_data
    }

    type = "kubernetes.io/tls"
}

resource "kubernetes_secret_v1" "cms_cert" {
    metadata {
        name        = "cms-cert"
        namespace   = "algomart"
    }

    binary_data = {
        "tls.crt" = data.google_secret_manager_secret_version.cms_crt.secret_data
        "tls.key" = data.google_secret_manager_secret_version.cms_private_key.secret_data
    }

    type = "kubernetes.io/tls"
}

resource "kubernetes_secret_v1" "api_cert" {
    metadata {
        name        = "api-cert"
        namespace   = "algomart"
    }

    binary_data = {
        "tls.crt" = data.google_secret_manager_secret_version.api_crt.secret_data
        "tls.key" = data.google_secret_manager_secret_version.api_private_key.secret_data
    }

    type = "kubernetes.io/tls"
}

resource "kubernetes_ingress_v1" "ingress" {
    metadata {
        name        = "algomart-ingress"
        namespace   = "algomart"
    }

    spec {
        tls {
            secret_name = "web-cert"
            hosts       = ["web-gke.algomart.dev"]
        }
        tls {
            secret_name = "cms-cert"
            hosts       = ["cms-gke.algomart.dev"]
        }
        tls {
            secret_name = "api-cert"
            hosts       = ["api-gke.algomart.dev"]
        }

        rule {
            host = "web-gke.algomart.dev"
            http {
                path {
                    path_type = "ImplementationSpecific"
                    backend {
                        service {
                            name = "web-lb"
                            port {
                                number = 3000
                            }
                        }
                    }
                }            
            }
        }
        rule {
            host = "cms-gke.algomart.dev"
            http {
                path {
                    path_type = "ImplementationSpecific"
                    backend {
                        service {
                            name = "cms-lb"
                            port {
                                number = 8055
                            }
                        }
                    }
                }            
            }
        }
        rule {
            host = "api-gke.algomart.dev"
            http {
                path {
                    path_type = "ImplementationSpecific"
                    backend {
                        service {
                            name = "api-lb"
                            port {
                                number = 8080
                            }
                        }
                    }
                }            
            }
        }
    }
}

resource "kubernetes_manifest" "backend-cms" {
    //provider = kubernetes-alpha

    manifest = {
        "apiVersion" = "cloud.google.com/v1"
        "kind"       = "BackendConfig"
        "metadata"   = {
            "name"       = "cms-lb-backendconfig"
            "namespace"  = "algomart"
        }
        "spec" = {
            "healthCheck" = {
                "checkIntervalSec"  = "15"
                "timeoutSec"        = "10"
                "healthyThreshold"  = "1"
                "unhealthyThreshold"= "4"
                "requestPath"       = "/admin/login"
                
            }
        }
    }
}

resource "kubernetes_manifest" "backend-api" {
    //provider = kubernetes-alpha

    manifest = {
        "apiVersion" = "cloud.google.com/v1"
        "kind"       = "BackendConfig"
        "metadata"   = {
            "name"       = "api-lb-backendconfig"
            "namespace"  = "algomart"
        }
        "spec" = {
            "healthCheck" = {
                "checkIntervalSec"  = "15"
                "timeoutSec"        = "10"
                "healthyThreshold"  = "1"
                "unhealthyThreshold"= "4"
                "requestPath"       = "/docs/static/index.html"
            }
        }
    }
}