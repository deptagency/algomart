FROM node:16-bullseye

RUN apt update && apt install -y python2
RUN npm config set python python2
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

ENV NEXT_TELEMETRY_DISABLED 1
ENV CYPRESS_INSTALL_BINARY 0
ENV NEXT_SWC_MINIFY_DISABLED 1

# not copying anything else... relying on mapping volume from the host

CMD ["./run.sh"]
