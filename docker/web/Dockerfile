FROM node:16-alpine AS build
WORKDIR /app

# setup for node-gyp installs
RUN apk add g++ make python3

# install dependencies
COPY ../../dist/apps/web/package.json ./package.json
RUN npm install --production --no-package-lock
COPY ../../dist/apps/web/ ./

# need to manually copy the next-translate configuration
COPY ../../apps/web/i18n.js ./i18n.js

# next-translate requires pages/_app.js to be present
RUN mkdir pages && touch pages/_app.js

# new stage to exclude build tools
FROM node:16-alpine AS run
WORKDIR /app

# copy built files
COPY --from=build /app/ ./

CMD ["npm", "start"]
