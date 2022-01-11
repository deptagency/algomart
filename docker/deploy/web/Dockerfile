# Multi-stage Dockerfile from Vercel
#
# See:
#   - Original image:  https://nextjs.org/docs/deployment#docker-image
#   - Why multi-stage: https://docs.docker.com/develop/develop-images/multistage-build/
#
# Adapted to...
#   - Use `npm` instead of `yarn`
#   - Explicitly use node 14
#
# IMPORTANT: Building this image REQUIRES ENVIRONMENT VARIABLES for the environment
#            being built for, eg. building an image for production use requires API
#            URLs, keys, etc. for that specific environment baked into the image

# Install dependencies only when needed
FROM node:16-bullseye-slim

WORKDIR /app

COPY ./apps/web/locales ./apps/web/locales
COPY ./apps/web/public  ./apps/web/public
COPY ./apps/web/src     ./apps/web/src
COPY \
  ./apps/web/package*.json           \
  ./apps/web/i18n.js                 \
  ./apps/web/next-env.d.ts           \
  ./apps/web/next.config.js          \
  ./apps/web/postcss.config.js       \
  ./apps/web/tailwind.config.js      \
  ./apps/web/tsconfig.json           \
  ./apps/web/

COPY ./libs/schemas/src ./libs/schemas/src
COPY \
  ./libs/schemas/package*.json    \
  ./libs/schemas/rollup.config.js \
  ./libs/schemas/tsconfig.json    \
  ./libs/schemas/

COPY ./package*.json ./

RUN npm install
RUN npm run build:schemas
RUN npm run build:web

WORKDIR /app/apps/web

# Need to ensure _app.js exists to prevent next-translate crashing the app
# https://github.com/vinissimus/next-translate/issues/421#issuecomment-750824513
RUN mkdir ./pages && touch ./pages/_app.js

# Disable anonymous NextJS usage telemetry
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
