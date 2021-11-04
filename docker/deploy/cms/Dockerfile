FROM node:16-bullseye-slim

WORKDIR /directus
COPY ./apps/cms/extensions ./extensions
COPY ./apps/cms/package*.json ./
COPY ./docker/deploy/cms/run.sh ./run.sh

RUN npm install

CMD ["./run.sh"]
