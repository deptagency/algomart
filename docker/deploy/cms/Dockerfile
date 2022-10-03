# Build stage
FROM debian:bullseye AS build

# Install Node.js and build tools
RUN apt-get update
RUN apt-get install -y curl build-essential
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Install Node.js runtime dependencies
WORKDIR /directus
COPY ./apps/cms .
RUN npm install directus@9.16.1

###

# Runtime stage
FROM debian:bullseye-slim AS run

# Install Node.js and Nginx (gettext is needed for the `envsubst` command)
RUN apt-get update
RUN apt-get install -y curl nginx gettext
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Copy over default Nginx config
COPY ./docker/deploy/cms/nginx.conf /etc/nginx/sites-available/default.template

# Copy over node_modules from build and runtime files
WORKDIR /directus
RUN mkdir uploads
COPY --from=build /directus/ ./
COPY ./docker/deploy/cms/run.sh .

CMD ["./run.sh"]

