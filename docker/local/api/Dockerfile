FROM node:14-bullseye-slim

RUN npm install -g npm@7

WORKDIR /app

COPY ./docker/local/api/run.sh /app/run.sh

CMD ["./run.sh"]
