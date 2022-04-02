FROM node:16-alpine

WORKDIR /app
RUN npm install directus@9.8.0 --global
COPY docker/local/cms/run.sh ./
COPY apps/cms/ ./

CMD ["./run.sh"]
