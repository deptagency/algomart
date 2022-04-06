FROM node:16-bullseye

RUN apt update && apt install -y python2
RUN npm config set python python2
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

CMD ["./docker/local/cms/run.sh"]
