FROM node:16-alpine

RUN apk add --no-cache libc6-compat python2 make g++
RUN npm config set python python2
WORKDIR /app
RUN npm install directus@9.8.0 --global
COPY docker/local/cms/run.sh ./
COPY apps/cms/ ./

CMD ["./run.sh"]
