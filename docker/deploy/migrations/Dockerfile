FROM node:16-bullseye

WORKDIR /app

# need to remove the npm packages canvas and sqlite3 to remove the next few lines
RUN apt update && apt install python2 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev sqlite3 -y
ENV PYTHON=/usr/bin/python2
RUN npm config set python="/usr/bin/python2"

# Setup nx
RUN npm install --global nx

# Install dependencies
COPY package*.json ./
RUN npm install --build-from-source

# Add remaining files
COPY . .
COPY docker/deploy/migrations/run.sh ./

CMD ["./run.sh"]
