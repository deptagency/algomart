# Install dependencies only when needed
FROM node:16-bullseye AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat python2 make g++
RUN apt update && apt install -y python2
RUN npm config set python python2 && \
  npm config set legacy-peer-deps true
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
COPY ./apps/api/project.json ./apps/api/project.json
COPY ./apps/scribe/project.json ./apps/scribe/project.json
COPY ./apps/web-e2e/project.json ./apps/web-e2e/project.json
COPY ./apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx nx run web:build:production

FROM node:16-bullseye AS runner

RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 algomart && \
  npm config set legacy-peer-deps true

COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder --chown=algomart:nodejs /app/dist/apps/web/ ./

RUN npm install --no-package-lock --production && \
  npm cache clear --force && \
  npm install --no-package-lock --verbose --unsafe-perm sharp

COPY ./docker/deploy/web/run.sh .
COPY ./GITHUB_SHA.txt .
COPY ./GITHUB_REF_NAME.txt .

USER algomart

CMD ["./run.sh"]
