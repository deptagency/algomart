FROM node:16-bullseye

RUN apt update && apt install -y python2
RUN npm config set python python2
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# not copying anything else... relying on mapping volume from the host
CMD ["./docker/local/api/run.sh"]
