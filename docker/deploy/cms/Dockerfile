FROM node:16-bullseye-slim

WORKDIR /app
COPY docker/deploy/cms/run.sh ./
COPY apps/cms/ ./
RUN npm install directus@9.4.3 --save-exact --global

CMD ["./run.sh"]
