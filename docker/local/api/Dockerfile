FROM node:16-alpine

RUN apk add --no-cache libc6-compat python2 make g++
RUN npm config set python python2
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# not copying anything else... relying on mapping volume from the host

CMD ["npx", "nx", "serve", "api"]
