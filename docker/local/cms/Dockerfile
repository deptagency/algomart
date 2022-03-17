FROM node:16-alpine

WORKDIR /app
COPY docker/local/cms/run.sh ./
COPY apps/cms/ ./
RUN npm install directus --global

CMD ["./run.sh"]
