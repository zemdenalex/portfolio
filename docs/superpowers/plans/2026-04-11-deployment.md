# P002 Portfolio VPS Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the portfolio site (Go API + Next.js + PostgreSQL) to archifex.space via Docker Compose with nginx reverse proxy and Let's Encrypt SSL.

**Architecture:** Four Docker containers (nginx, app, api, db) + certbot for SSL. nginx is the only service with published ports (80/443). Browser API calls route through nginx, server-side Next.js calls go direct to the Go API container over the Docker network.

**Tech Stack:** Docker Compose, nginx (Alpine), Certbot/Let's Encrypt, PostgreSQL 16, Go 1.25, Next.js 16 (standalone output)

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `deploy/docker-compose.prod.yml` | Production compose with 5 services |
| Create | `deploy/nginx.conf` | Reverse proxy + SSL config |
| Create | `deploy/.env.example` | Template for production secrets |
| Create | `deploy/init-letsencrypt.sh` | One-time SSL bootstrap script |
| Modify | `app/Dockerfile` | Remove Prisma refs, add `NEXT_PUBLIC_API_URL` build arg |
| Modify | `app/.env.example` | Replace stale NextAuth/Prisma vars with actual vars |
| Delete | `app/docker-compose.yml` | Stale duplicate from Prisma template |
| Modify | `deploy/.env.example` → `deploy/.env` | Fill in real secrets (on VPS only, never committed) |

---

### Task 1: Fix app Dockerfile

**Files:**
- Modify: `app/Dockerfile`

- [ ] **Step 1: Replace Dockerfile contents**

Remove Prisma references (`prisma/`, `prisma.config.ts`, `npx prisma generate`) — none of these exist in the project. Add `ARG NEXT_PUBLIC_API_URL` so the build bakes in the correct API base URL.

Write `app/Dockerfile`:

```dockerfile
FROM node:22-alpine AS base

# ─── Dependencies ────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─── Build ───────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Production ──────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: Verify Dockerfile builds locally**

Run: `cd app && docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 -t portfolio-app .`

Expected: Build completes successfully, outputs image ID.

- [ ] **Step 3: Commit**

```bash
git add app/Dockerfile
git commit -m "fix: remove Prisma refs from app Dockerfile, add API URL build arg"
```

---

### Task 2: Clean up stale files

**Files:**
- Delete: `app/docker-compose.yml`
- Modify: `app/.env.example`

- [ ] **Step 1: Delete stale docker-compose**

```bash
rm app/docker-compose.yml
```

This file is a leftover from a Prisma-based template. The dev compose lives at the project root (`docker-compose.yml`) and production compose will be in `deploy/`.

- [ ] **Step 2: Update app/.env.example**

Replace the contents of `app/.env.example` with the actual env vars the app uses (defined in `app/src/lib/api.ts`):

```env
# API URL for browser requests (goes through nginx in production)
NEXT_PUBLIC_API_URL=http://localhost:8080

# API URL for server-side requests (direct container-to-container in production)
API_URL=http://localhost:8080
```

- [ ] **Step 3: Commit**

```bash
git add -u app/docker-compose.yml
git add app/.env.example
git commit -m "chore: remove stale app docker-compose, update env example"
```

---

### Task 3: Create deploy/.env.example

**Files:**
- Create: `deploy/.env.example`

- [ ] **Step 1: Create deploy directory and env template**

```bash
mkdir -p deploy
```

Write `deploy/.env.example`:

```env
# Domain
DOMAIN=archifex.space

# PostgreSQL
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=portfolio

# Go API
JWT_SECRET=<generate-64-char-secret>
JWT_EXPIRY=720h
FRONTEND_URL=https://archifex.space
UPLOAD_PATH=/data/uploads
UPLOAD_MAX_SIZE=10485760
ADMIN_EMAIL=zemdenwork@gmail.com
ADMIN_PASSWORD=<strong-admin-password>
ADMIN_NAME=Denis Zemtsov

# Next.js (client-side — browser calls go through nginx)
NEXT_PUBLIC_API_URL=https://archifex.space
```

- [ ] **Step 2: Commit**

```bash
git add deploy/.env.example
git commit -m "chore: add production env template"
```

---

### Task 4: Create nginx config

**Files:**
- Create: `deploy/nginx.conf`

- [ ] **Step 1: Write nginx.conf**

Write `deploy/nginx.conf`:

```nginx
server {
    listen 80;
    server_name archifex.space;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name archifex.space;

    ssl_certificate     /etc/letsencrypt/live/archifex.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/archifex.space/privkey.pem;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://api:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://api:8080;
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://api:8080;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add deploy/nginx.conf
git commit -m "chore: add nginx reverse proxy config with SSL"
```

---

### Task 5: Create docker-compose.prod.yml

**Files:**
- Create: `deploy/docker-compose.prod.yml`

- [ ] **Step 1: Write production compose file**

Write `deploy/docker-compose.prod.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot-conf:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot:ro
    depends_on:
      - app
      - api
    restart: unless-stopped

  app:
    build:
      context: ../app
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    environment:
      - API_URL=http://api:8080
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: ../api
      dockerfile: Dockerfile
    environment:
      - PORT=8080
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=${POSTGRES_USER}
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - DB_NAME=${POSTGRES_DB}
      - DB_SSLMODE=disable
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRY=${JWT_EXPIRY}
      - FRONTEND_URL=${FRONTEND_URL}
      - UPLOAD_PATH=${UPLOAD_PATH}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_NAME=${ADMIN_NAME}
    volumes:
      - uploads:/data/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-conf:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h; done'"

volumes:
  pgdata:
  uploads:
  certbot-conf:
  certbot-www:
```

- [ ] **Step 2: Validate compose syntax**

Run: `cd deploy && docker compose -f docker-compose.prod.yml config --quiet`

Expected: No errors (just validates YAML structure; services won't resolve env vars without `.env`).

- [ ] **Step 3: Commit**

```bash
git add deploy/docker-compose.prod.yml
git commit -m "chore: add production Docker Compose (nginx, app, api, db, certbot)"
```

---

### Task 6: Create SSL bootstrap script

**Files:**
- Create: `deploy/init-letsencrypt.sh`

- [ ] **Step 1: Write init-letsencrypt.sh**

This script bootstraps SSL with a chicken-and-egg solution: nginx needs certs to start, but certbot needs nginx to serve the ACME challenge.

Write `deploy/init-letsencrypt.sh`:

```bash
#!/bin/bash

# init-letsencrypt.sh — Bootstrap Let's Encrypt SSL for archifex.space
# Run once on initial deploy. After that, certbot container auto-renews.

set -e

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
```

- [ ] **Step 2: Make executable**

```bash
chmod +x deploy/init-letsencrypt.sh
```

- [ ] **Step 3: Commit**

```bash
git add deploy/init-letsencrypt.sh
git commit -m "chore: add SSL bootstrap script for initial Let's Encrypt setup"
```

---

### Task 7: Push to GitHub and deploy to VPS

**Files:**
- No file changes — deployment commands only

- [ ] **Step 1: Push all changes to GitHub**

```bash
git push origin master
```

- [ ] **Step 2: SSH into VPS and install Docker**

```bash
ssh root@45.141.102.154

# On VPS:
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
docker --version
```

Expected: Docker installed, version 20.x+ or 24.x+.

- [ ] **Step 3: Clone repo on VPS**

```bash
# On VPS:
mkdir -p /opt && cd /opt
git clone https://github.com/zemdenalex/portfolio.git archifex
cd archifex
```

- [ ] **Step 4: Create production .env**

```bash
# On VPS:
cd /opt/archifex/deploy
cp .env.example .env
nano .env
```

Fill in real values:
- `POSTGRES_PASSWORD` — generate with `openssl rand -hex 16`
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `ADMIN_PASSWORD` — choose a strong password
- All other values use defaults from the template

- [ ] **Step 5: Bootstrap SSL and start services**

```bash
# On VPS:
cd /opt/archifex/deploy
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

Expected: Script creates dummy cert, starts nginx, gets real cert from Let's Encrypt, restarts everything.

- [ ] **Step 6: Verify deployment**

```bash
# Health check
curl https://archifex.space/health
# Expected: {"data":{"status":"ok"}}

# Homepage
curl -s -o /dev/null -w "%{http_code}" https://archifex.space
# Expected: 200

# HTTP redirect
curl -s -o /dev/null -w "%{http_code}" http://archifex.space
# Expected: 301

# API endpoint
curl https://archifex.space/api/public/portfolio
# Expected: JSON with portfolio data

# Admin page
curl -s -o /dev/null -w "%{http_code}" https://archifex.space/admin/login
# Expected: 200
```

- [ ] **Step 7: Verify in browser**

Open and check:
1. `https://archifex.space` — homepage loads, portfolio visible
2. `https://archifex.space/en/portfolio` — grid shows projects
3. `https://archifex.space/en/quiz` — quiz loads
4. `https://archifex.space/ru/` — Russian locale works
5. `https://archifex.space/admin/login` — admin login page
6. Login with `zemdenwork@gmail.com` + admin password — dashboard loads
7. SSL padlock shows valid certificate

---

### Task 8: Update CLAUDE.md and spec status

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-04-11-deployment-design.md`

- [ ] **Step 1: Update CLAUDE.md deployment status**

In the project CLAUDE.md, update the Current Phase section:
- Change status from "Dev (Phase 1 MVP)" to "Production"
- Change next action from "Deploy" to "Phase 2 planning"
- Change blocked by to "Nothing"
- Add the production URL: `https://archifex.space`

- [ ] **Step 2: Update spec status**

In `docs/superpowers/specs/2026-04-11-deployment-design.md`, change the `<repo-url>` placeholder to `https://github.com/zemdenalex/portfolio.git`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-04-11-deployment-design.md
git commit -m "docs: update status to production, add deployment URL"
```

- [ ] **Step 4: Push and redeploy**

```bash
git push origin master

# On VPS:
cd /opt/archifex && git pull
cd deploy && docker compose -f docker-compose.prod.yml up --build -d
```
