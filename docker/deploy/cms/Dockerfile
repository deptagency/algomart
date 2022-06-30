FROM node:16-bullseye-slim

WORKDIR /app
RUN npm install directus@9.12.1 --global
COPY ./apps/cms .
COPY ./docker/deploy/cms/run.sh .

CMD ["./run.sh"]
