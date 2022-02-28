FROM node:16-bullseye AS builder

WORKDIR /app

# need to remove the npm packages canvas and sqlite3 to remove the next few lines
RUN apt update && apt install python2 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev sqlite3 -y
ENV PYTHON=/usr/bin/python2
RUN npm config set python="/usr/bin/python2"

# setup nx
RUN npm install --global nx

# install dependencies
COPY package*.json ./
RUN npm install --build-from-source

# build scribe
COPY . .
RUN nx run scribe:build:production

FROM node:16-bullseye-slim AS runner

WORKDIR /app
COPY --from=builder /app/ ./
RUN npm install --global nx

WORKDIR /app/dist/apps/scribe
RUN npm install 
RUN npm install tslib@2 pino-pretty@7 pg@8 --save-exact
COPY docker/deploy/scribe/run.sh ./

CMD ["./run.sh"]
