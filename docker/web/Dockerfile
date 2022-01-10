FROM node:16-alpine AS build

# setup for node-gyp installs
RUN apk add g++ make python3

WORKDIR /app
COPY ../../dist/apps/web/package.json ./package.json
RUN npm install --no-package-lock

FROM node:16-alpine AS run

WORKDIR /app
COPY --from=build /app/ ./
COPY ../../dist/apps/web/ ./

# CMD ["ls", "-la", "./.next"]
# FIXME this is not working, cannot find the /app/.next folder?
CMD ["npm", "start"]
