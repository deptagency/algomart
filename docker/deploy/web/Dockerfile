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
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx nx run web:build:production


# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ ./node_modules/
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/ ./.next/
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/package.json ./

# Copy and setup files for next-translate
COPY --from=builder /app/apps/web/i18n.js ./i18n.js
COPY --from=builder /app/apps/web/languages/ ./languages/
RUN mkdir pages && touch pages/_app.js
RUN npm install --no-package-lock --production

USER nextjs

CMD ["npm", "start"]
