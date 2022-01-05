locals {
  config_map_auth = <<CONFIGMAPAWSAUTH
---
# NAMESPACE #
apiVersion: v1
kind: Namespace
metadata:
  name: algomart
---
# CONFIG MAG #
apiVersion: v1
kind: ConfigMap
metadata:
  name: algomart-web-config
  namespace: algomart
data:
  firebase-service-account.json: |
    ${data.google_secret_manager_secret_version.web_firebase_service_account.secret_data}
  firebase-config.json: |
    ${data.google_secret_manager_secret_version.web_next_public_firebase_config.secret_data}
  credentials.json: |
    ${data.google_secret_manager_secret_version.credentials.secret_data}
---
# DEPLOYMENT MANIFEST #
apiVersion: apps/v1
kind: Deployment
metadata:
  name: algomart-web
  namespace: algomart
spec:
  replicas: 3
  selector:
    matchLabels:
      app: algomart-web
  template:
    metadata:
      labels:
        app: algomart-web
    spec:
      containers:
      - name: algomart-web
        image: us-east4-docker.pkg.dev/qam-project-331620/algomart/web:e856485      # docker image
        ports:
        - containerPort: 3000
        env:
        - name: API_KEY
          value: ${data.google_secret_manager_secret_version.api_key.secret_data}
        - name: API_URL
          value: "https://${data.google_secret_manager_secret_version.api_domain_mapping.secret_data}"
        - name: FIREBASE_SERVICE_ACCOUNT
          valueFrom:
            configMapKeyRef:
              name: algomart-web-config
              key: firebase-service-account.json
        - name: NEXT_PUBLIC_FIREBASE_CONFIG
          valueFrom:
            configMapKeyRef:
              name: algomart-web-config
              key: firebase-config.json
        - name: IMAGE_DOMAINS
          value: "lh3.googleusercontent.com,firebasestorage.googleapis.com,${data.google_secret_manager_secret_version.cms_domain_mapping.secret_data}"
        - name: NEXT_PUBLIC_3JS_DEBUG
          value: ${var.web_next_public_3js_debug}
        - name: NODE_ENV
          value: ${var.web_node_env}
---
# DEPLOYMENT MANIFEST #
apiVersion: apps/v1
kind: Deployment
metadata:
  name: algomart-cms
  namespace: algomart
spec:
  replicas: 3
  selector:
    matchLabels:
      app: algomart-cms
  template:
    metadata:
      labels:
        app: algomart-cms
    spec:
      containers:
      - name: algomart-cms
        image: us-east4-docker.pkg.dev/qam-project-331620/algomart/cms:4e1fe2f      # docker image
        ports:
        - containerPort: 8055
        env:
        - name  : ADMIN_EMAIL
          value : ${data.google_secret_manager_secret_version.cms_admin_email.secret_data}

        - name  : ADMIN_PASSWORD
          value : ${data.google_secret_manager_secret_version.cms_admin_password.secret_data}
        # Directus supports a `DB_CONNECTION_STRING` env var that takes precedence over these,
        # but even with that variable set Directus will error without these set as well
        - name  : DB_CLIENT
          value : "postgres"

        - name  : DB_HOST
          value : ${google_sql_database_instance.database_server.private_ip_address}

        - name  : DB_PORT
          value : "5432"

        - name  : DB_DATABASE
          value : ${google_sql_database.cms_database.name}
   
        - name  : DB_USER
          value : ${google_sql_user.cms_user.name}
    
        - name  : DB_PASSWORD
          value : ${google_sql_user.cms_user.password}
        
        - name  : KEY
          value : ${data.google_secret_manager_secret_version.cms_key.secret_data}
     
        - name  : HOST
          value : "0.0.0.0"
   
        - name  : NODE_ENV
          value : ${var.cms_node_env}
     
        - name  : PUBLIC_URL
          value : "https://${data.google_secret_manager_secret_version.cms_domain_mapping.secret_data}"

        - name  : SECRET
          value : ${data.google_secret_manager_secret_version.cms_secret.secret_data}

        # The "locations" value is a comma-separate string of arbitrary values.
        # Directus doesn't expect any specific value(s); instead, it uses those
        # locations to look for other environment variables.
        #
        # With a value of "google" it looks for `STORAGE_GOOGLE_DRIVER`, etc.
        # but with a value of "gcp" it would look for `STORAGE_GCP_DRIVER`, etc.
        # Likewise, with a value of "gcp,aws" it would configure 2 storage drivers
        # and look for `STORAGE_GCP_DRIVER` and `STORAGE_AWS_DRIVER`.
        #
        # The values of *those* environment variables, however, are not arbitrary.
        - name  : STORAGE_LOCATIONS
          value : "gcp"
     
        - name  : STORAGE_GCP_DRIVER
          value : "gcs"
  
        - name  : STORAGE_GCP_BUCKET
          value : ${google_storage_bucket.cms_bucket.name}
     
        - name  : STORAGE_GCP_CREDENTIALS
          valueFrom:
            configMapKeyRef:
              name: algomart-web-config
              key: credentials.json
---
# DEPLOYMENT MANIFEST #
apiVersion: apps/v1
kind: Deployment
metadata:
  name: algomart-api
  namespace: algomart
spec:
  replicas: 3
  selector:
    matchLabels:
      app: algomart-api
  template:
    metadata:
      labels:
        app: algomart-api
    spec:
      containers:
      - name: algomart-api
        image: us-east4-docker.pkg.dev/qam-project-331620/algomart/api:4e1fe2f      # docker image
        ports:
        - containerPort: 8080
        env:
        - name  : ALGOD_SERVER
          value : ${data.google_secret_manager_secret_version.algod_host.secret_data}

        - name  : ALGOD_PORT
          value : "${data.google_secret_manager_secret_version.algod_port.secret_data}"

        - name  : ALGOD_TOKEN
          value : ${data.google_secret_manager_secret_version.algod_key.secret_data}

        - name  : API_KEY
          value : ${data.google_secret_manager_secret_version.api_key.secret_data}

        - name  : CIRCLE_API_KEY
          value : ${data.google_secret_manager_secret_version.circle_key.secret_data}

        - name  : CIRCLE_URL
          value : ${data.google_secret_manager_secret_version.circle_url.secret_data}
   
        - name  : CMS_ACCESS_TOKEN
          value : ${data.google_secret_manager_secret_version.cms_key.secret_data}
    
        - name  : CMS_URL
          value : "https://${data.google_secret_manager_secret_version.cms_domain_mapping.secret_data}"
        
        - name  : CREATOR_PASSPHRASE
          value : ${data.google_secret_manager_secret_version.api_creator_passphrase.secret_data}
     
        - name  : DATABASE_URL
          value : "postgresql://${google_sql_user.api_user.name}:${google_sql_user.api_user.password}@${google_sql_database_instance.database_server.private_ip_address}:5432/${google_sql_database.api_database.name}"
   
        - name  : DATABASE_SCHEMA
          value : ${data.google_secret_manager_secret_version.api_database_schema.secret_data}

        - name  : FUNDING_MNEMONIC
          value : ${data.google_secret_manager_secret_version.api_funding_mnemonic.secret_data}

        - name  : HOST
          value : "0.0.0.0"

        - name  : PORT
          value : "8080"
     
        - name  : NODE_ENV
          value : ${var.api_node_env}
  
        - name  : SECRET
          value : ${data.google_secret_manager_secret_version.api_secret.secret_data}
     
        - name  : SENDGRID_API_KEY
          value : ${data.google_secret_manager_secret_version.sendgrid_key.secret_data}

        - name  : SENDGRID_FROM_EMAIL
          value : ${data.google_secret_manager_secret_version.sendgrid_from_email.secret_data}

        - name  : WEB_URL
          value : "https://${data.google_secret_manager_secret_version.web_domain_mapping.secret_data}"

        - name  : LOG_LEVEL
          value : "debug"

        - name  : EMAIL_TRANSPORT
          value : "sendgrid"

        - name  : SMTP_PORT
          value : "25"
---
# BACKEND MANIFEST #
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: web-lb-backendconfig
  namespace: algomart
spec:
  healthCheck:
    checkIntervalSec: 15
    timeoutSec: 10
    healthyThreshold: 1
    unhealthyThreshold: 4
    requestPath: /
    port: 3000
---
# BACKEND MANIFEST #
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: cms-lb-backendconfig
  namespace: algomart
spec:
  healthCheck:
    checkIntervalSec: 15
    timeoutSec: 10
    healthyThreshold: 1
    unhealthyThreshold: 4
    requestPath: /admin/login
    port: 8055
---
# BACKEND MANIFEST #
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: api-lb-backendconfig
  namespace: algomart
spec:
  healthCheck:
    checkIntervalSec: 15
    timeoutSec: 10
    healthyThreshold: 1
    unhealthyThreshold: 4
    requestPath: /docs/static/index.html 
    port: 8080
---
# SERVICE MANIFEST #
apiVersion: v1
kind: Service
metadata:
  name: web-lb
  namespace: algomart
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    loud.google.com/backend-config: '{"default": "web-lb-backendconfig"}'
  labels:
    app: algomart-web
spec:
  ports:
  - port: 3000
    protocol: TCP
    targetPort: 3000
  selector:
    app: algomart-web
  type: LoadBalancer
---
# SERVICE MANIFEST #
apiVersion: v1
kind: Service
metadata:
  name: cms-lb
  namespace: algomart
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    cloud.google.com/backend-config: '{"default": "cms-lb-backendconfig"}'
  labels:
    app: algomart-cms
spec:
  ports:
  - port: 8055
    protocol: TCP
    targetPort: 8055
  selector:
    app: algomart-cms
  type: LoadBalancer
---
# SERVICE MANIFEST #
apiVersion: v1
kind: Service
metadata:
  name: api-lb
  namespace: algomart
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    cloud.google.com/backend-config: '{"default": "api-lb-backendconfig"}'
  labels:
    app: algomart-api
spec:
  ports:
  - port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    app: algomart-api
  type: LoadBalancer
---
# Web Service Cert #
apiVersion: v1
data:
  tls.crt: ${data.google_secret_manager_secret_version.web_crt.secret_data}
  tls.key: ${data.google_secret_manager_secret_version.web_private_key.secret_data}
kind: Secret
metadata:
  name: web-cert
  namespace: algomart
type: kubernetes.io/tls
---
# CMS Service Cert #
apiVersion: v1
data:
  tls.crt: ${data.google_secret_manager_secret_version.cms_crt.secret_data}
  tls.key: ${data.google_secret_manager_secret_version.cms_private_key.secret_data}
kind: Secret
metadata:
  name: cms-cert
  namespace: algomart
type: kubernetes.io/tls
---
# API Service Cert #
apiVersion: v1
data:
  tls.crt: ${data.google_secret_manager_secret_version.api_crt.secret_data}
  tls.key: ${data.google_secret_manager_secret_version.api_private_key.secret_data}
kind: Secret
metadata:
  name: api-cert
  namespace: algomart
type: kubernetes.io/tls
---
# INGRESS #
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress
  namespace: algomart
  annotations:
    # If the class annotation is not specified it defaults to "gce".
    kubernetes.io/ingress.class: "gce"
spec:
  tls:
  - secretName: api-cert
  - secretName: cms-cert
  - secretName: web-cert
  rules:
  - host: web-gke.algomart.dev
    http:
      paths:
      - pathType: ImplementationSpecific
        backend:
          service:
            name: web-lb
            port:
              number: 3000
  - host: cms-gke.algomart.dev
    http:
      paths:
      - pathType: ImplementationSpecific
        backend:
          service:
            name: cms-lb
            port:
              number: 8055
  - host: api-gke.algomart.dev
    http:
      paths:
      - pathType: ImplementationSpecific
        backend:
          service:
            name: api-lb
            port:
              number: 8080
CONFIGMAPAWSAUTH
}

# Store the configmap from above into a file
resource "local_file" "config_map_auth" {
  content = local.config_map_auth
  filename = "services.yaml"
}

# connect k8s cluster
resource "null_resource" "connect-cluster" {
  provisioner "local-exec" {
    command = "gcloud container clusters get-credentials ${var.cluster_name} --region ${var.region} --project ${var.project}"
  }
  depends_on = [local_file.config_map_auth, module.gke]
}

resource "null_resource" "apply_manifest" {
  provisioner "local-exec" {
    command = "kubectl apply -f services.yaml"
  }
  provisioner "local-exec" {
    command = "rm services.yaml"
  }
  depends_on = [local_file.config_map_auth, null_resource.connect-cluster, module.gke]
}

resource "null_resource" "delete_config" {
  provisioner "local-exec" {
    when    = destroy
    command = "kubectl delete ns algomart"
  }
}