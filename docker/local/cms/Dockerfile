FROM node:16-bullseye-slim

WORKDIR /directus

COPY ./apps/cms/package*.json ./
COPY ./docker/local/cms/run.sh ./run.sh

RUN npm install
RUN npm install directus@9.6.0 --save-exact --global

COPY apps/cms/ ./

CMD ["./run.sh"]
