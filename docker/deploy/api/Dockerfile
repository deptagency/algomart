FROM node:16-bullseye-slim AS deps

WORKDIR /app

COPY \
  ./services/api/package*.json    \
  ./services/api/rollup.config.js \
  ./services/api/tsconfig.json    \
  ./services/api/

COPY ./services/api/locales ./services/api/locales
COPY ./services/api/src     ./services/api/src

COPY \
  ./packages/schemas/package*.json    \
  ./packages/schemas/rollup.config.js \
  ./packages/schemas/tsconfig.json    \
  ./packages/schemas/

COPY ./packages/schemas/src ./packages/schemas/src

COPY ./package*.json ./

RUN npm install
RUN npm run build:schemas
RUN npm run build:api

COPY ./docker/deploy/api/run.sh ./services/api/run.sh

WORKDIR /app/services/api

CMD ["./run.sh"]
