FROM node:16-bullseye-slim

WORKDIR /app
RUN npm install directus@9.8.0 --global
COPY ./apps/cms .
COPY ./docker/deploy/cms/run.sh .

CMD ["./run.sh"]
