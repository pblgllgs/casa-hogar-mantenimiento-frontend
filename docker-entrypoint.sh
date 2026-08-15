#!/bin/sh
set -e

if [ -z "${NGINX_BACKEND_URL}" ]; then
  echo "WARNING: NGINX_BACKEND_URL no definida, usando http://backend:8080"
  export NGINX_BACKEND_URL="http://backend:8080"
fi

NGINX_BACKEND_HOST=$(echo "$NGINX_BACKEND_URL" | sed -E 's|^https?://([^/:]+).*|\1|')
echo "Backend host: $NGINX_BACKEND_HOST"
export NGINX_BACKEND_HOST

envsubst '${NGINX_BACKEND_URL} ${NGINX_BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
