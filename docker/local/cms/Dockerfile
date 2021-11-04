FROM node:16-bullseye-slim

WORKDIR /directus

COPY ./apps/cms/package*.json ./
COPY ./docker/local/cms/run.sh ./run.sh

RUN npm install

CMD ["./run.sh"]
