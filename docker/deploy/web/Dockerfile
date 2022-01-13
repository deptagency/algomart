FROM node:16-bullseye AS builder

WORKDIR /app

# need to remove the npm packages canvas and sqlite3 to remove the next few lines
RUN apt update && apt install python2 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev sqlite3 -y
ENV PYTHON=/usr/bin/python2
RUN npm config set python="/usr/bin/python2"

# Setup nx
RUN npm install --global nx

# install dependencies
COPY package*.json ./
RUN npm install --build-from-source

# Copy remaining files
COPY . .
RUN nx run web:build:production


FROM node:16-bullseye AS runner

WORKDIR /app

COPY --from=builder /app/dist/apps/web/ ./

# need to manually copy the next-translate configuration
COPY --from=builder /app/apps/web/i18n.js ./i18n.js
COPY --from=builder /app/apps/web/locales/ ./locales/

# next-translate requires pages/_app.js to be present
RUN mkdir pages && touch pages/_app.js
RUN npm install --no-package-lock --production
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "start"]
