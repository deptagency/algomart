FROM node:16-bullseye-slim

WORKDIR /app

COPY ./docker/local/web/run.sh /app/run.sh

# Disable anonymous NextJS usage telemetry
ENV NEXT_TELEMETRY_DISABLED 1
ENV CYPRESS_INSTALL_BINARY 0

CMD ["./run.sh"]
