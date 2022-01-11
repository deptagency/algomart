FROM node:16-bullseye-slim AS deps

WORKDIR /app

COPY \
  ./apps/api/package*.json    \
  ./apps/api/rollup.config.js \
  ./apps/api/tsconfig.json    \
  ./apps/api/

COPY ./apps/api/locales ./apps/api/locales
COPY ./apps/api/src     ./apps/api/src

COPY \
  ./libs/schemas/package*.json    \
  ./libs/schemas/rollup.config.js \
  ./libs/schemas/tsconfig.json    \
  ./libs/schemas/

COPY ./libs/schemas/src ./libs/schemas/src

COPY ./package*.json ./

RUN npm install
RUN npm run build:schemas
RUN npm run build:api

COPY ./docker/deploy/api/run.sh ./apps/api/run.sh

WORKDIR /app/apps/api

CMD ["./run.sh"]
