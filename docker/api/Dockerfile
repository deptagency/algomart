FROM node:16-alpine

# this dockerfile assumes the project has already been built via `nx build api`

WORKDIR /app

# copy generated package.json for the api
COPY ../../dist/apps/api/package.json ./package.json

# no need for --production, the package.json already only includes production dependencies
RUN npm install --no-package-lock

# these runtime dependencies are not included in the generated package.json
RUN npm install tslib@2 pino-pretty@7 pg@8 --save-exact --no-package-lock

# copy remaining files from api dist folder
COPY ../../dist/apps/api/ ./

# TODO harden dockerfile for security
# TODO expose port?

CMD ["node", "main.js"]
