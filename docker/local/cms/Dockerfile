FROM node:14-bullseye-slim

RUN npm install -g npm@7

WORKDIR /directus

COPY ./apps/cms/package*.json ./
COPY ./docker/local/cms/run.sh ./run.sh

RUN npm install

CMD ["./run.sh"]
