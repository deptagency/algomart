# Install dependencies only when needed
FROM node:16-bullseye AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat python2 make g++
# RUN npm config set python python2
RUN apt update && apt install -y python2
RUN npm config set python python2
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# Rebuild the source code only when needed
FROM node:16-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./package.json ./package-lock.json ./workspace.json ./tsconfig.base.json ./nx.json ./babel.config.json ./
COPY ./libs ./libs
COPY ./apps/cms/project.json ./apps/cms/project.json
COPY ./apps/scribe/project.json ./apps/scribe/project.json
COPY ./apps/web/project.json ./apps/web/project.json
COPY ./apps/web-e2e/project.json ./apps/web-e2e/project.json
COPY ./apps/api ./apps/api
RUN npx nx run api:build:production


# Production image, copy all the files and run the api
FROM node:16-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 algomart

# Copy it all... unable to copy just part of the files as we'll need "everything" to apply the migrations
COPY --from=builder /app/ .

WORKDIR /app/dist/apps/api
RUN npm set-script prepare "" && \
  npm install --no-package-lock --legacy-peer-deps && \
  npm install tslib@2 pino-pretty@7 pg@8 --no-package-lock

COPY ./docker/deploy/api/run.sh .

USER algomart

CMD ["./run.sh"]
