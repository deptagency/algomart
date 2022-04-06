# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python2 make g++
RUN npm config set python python2
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# Rebuild the source code only when needed
FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx nx run scribe:build:production


# Production image, copy all the files and run scribe
FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 algomart

# Copy it all... unable to copy just part of the files as we'll need "everything" to apply the migrations
COPY --chown=algomart:nodejs --from=builder /app/ ./

WORKDIR /app/dist/apps/scribe
RUN npm set-script prepare "" && \
  npm install --no-package-lock --legacy-peer-deps && \
  npm install tslib@2 pino-pretty@7 pg@8 --no-package-lock

COPY --chown=algomart:nodejs docker/deploy/scribe/run.sh ./

USER algomart

CMD ["./run.sh"]
