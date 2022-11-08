#!/usr/bin/env bash

# set -x # Prints every statement, for debugging
# set -e # Do not set, curl commands are expected to fail until healthchecks pass

echo "CloudRun target port: $PORT"

CLOUDRUN_PORT=$PORT
PREFLIGHT_PORT=$(($PORT+1))

unset PORT

PREFLIGHT_JOB=""

healthcheck(){
  # (( RANDOM % 10 ))
  ! curl -f --max-time 10 localhost:$PORT/api/health
}

startNextjsPreflightServer(){
  export ENABLE_CACHE_FLUSHING_ROUTE=true
  export PORT=$PREFLIGHT_PORT
  echo "Starting NextJS (pre-flight) on port $PREFLIGHT_PORT"
  npm start &
  # ping -i 2 google.com &
  PREFLIGHT_JOB=$!
}

stopNextjsPreflightServer(){
  echo "Stopping NextJS (pre-flight)..."
  echo "Preflight Job Id: $PREFLIGHT_JOB"
  kill $PREFLIGHT_JOB
  echo "Stopped."
}

startNextjsServer(){
  export PORT=$CLOUDRUN_PORT
  export ENABLE_CACHE_FLUSHING_ROUTE=false
  echo "Starting NextJS on port $CLOUDRUN_PORT"
  npm start
}

flushCaches(){
  echo "Flushing ISR Caches..."

  FLUSH_URL=localhost:$PREFLIGHT_PORT/api/flush-cache-custom

  curl -G --data-urlencode "path=/" $FLUSH_URL
  curl -G --data-urlencode "path=/es-ES" $FLUSH_URL
  curl -G --data-urlencode "path=/fr-FR" $FLUSH_URL
  curl -G --data-urlencode "path=/en-UK" $FLUSH_URL

  echo "Flushing complete."
}

# ------
# Run
# ------

startNextjsPreflightServer

while healthcheck
do

  echo "Health check failed"
  sleep 1

done

flushCaches

stopNextjsPreflightServer
startNextjsServer