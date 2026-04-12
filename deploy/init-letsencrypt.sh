#!/bin/bash

# init-letsencrypt.sh — Deploy archifex.space on shared VPS (co-hosted with NeuroBoost)
# nginx and certbot run on the host, app containers via Docker Compose.

set -e

DOMAIN="archifex.space"
EMAIL="zemdenwork@gmail.com"
COMPOSE="docker compose -f docker-compose.prod.yml"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DEPLOY_DIR"

# Pre-flight checks
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed."
  exit 1
fi

echo "### Step 1: Installing nginx site config ..."
cp nginx.conf /etc/nginx/sites-enabled/archifex
nginx -t && systemctl reload nginx

echo "### Step 2: Getting SSL certificate ..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL}

echo "### Step 3: Starting app containers ..."
${COMPOSE} up --build -d

echo "### Step 4: Verifying ..."
sleep 5
curl -s -o /dev/null -w "Health: %{http_code}\n" http://127.0.0.1:8082/health
curl -s -o /dev/null -w "App:    %{http_code}\n" http://127.0.0.1:3001

echo ""
echo "=== Deploy complete ==="
echo "Verify: curl https://${DOMAIN}/health"
