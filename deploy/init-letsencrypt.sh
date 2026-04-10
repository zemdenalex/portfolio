#!/bin/bash

# init-letsencrypt.sh — Bootstrap Let's Encrypt SSL for archifex.space
# Run once on initial deploy. After that, certbot container auto-renews.

set -e

# Pre-flight checks
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed."
  exit 1
fi

DOMAIN="archifex.space"
EMAIL="zemdenwork@gmail.com"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "### Creating dummy certificate for ${DOMAIN} ..."
mkdir -p "./certbot-dummy"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "./certbot-dummy/privkey.pem" \
  -out "./certbot-dummy/fullchain.pem" \
  -subj "/CN=${DOMAIN}" 2>/dev/null

echo "### Placing dummy certificate in certbot volume ..."
${COMPOSE} run --rm \
  -v "$(pwd)/certbot-dummy:/dummy:ro" \
  --entrypoint "" certbot sh -c "
    mkdir -p /etc/letsencrypt/live/${DOMAIN} &&
    cp /dummy/privkey.pem /etc/letsencrypt/live/${DOMAIN}/privkey.pem &&
    cp /dummy/fullchain.pem /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
  "

echo "### Starting nginx with dummy certificate ..."
${COMPOSE} up -d nginx

echo "### Requesting real certificate from Let's Encrypt ..."
${COMPOSE} run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email ${EMAIL} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN}

echo "### Reloading nginx with real certificate ..."
${COMPOSE} exec nginx nginx -s reload

echo "### Cleaning up dummy certs ..."
rm -rf "./certbot-dummy"

echo "### Starting all services ..."
${COMPOSE} up -d

echo ""
echo "=== SSL bootstrap complete ==="
echo "Verify: curl https://${DOMAIN}/health"
