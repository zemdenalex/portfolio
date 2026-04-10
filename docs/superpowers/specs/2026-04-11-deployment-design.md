# P002 Portfolio — VPS Deployment Spec

> Deploy Go API + Next.js + PostgreSQL to a single VPS with Docker Compose + nginx + SSL.

**Date:** 2026-04-11
**Status:** Approved (brainstorming complete)

---

## 1. Overview

Deploy the P002 Portfolio project (archifex.space) to a single RuVDS VPS using Docker Compose. All four services — nginx, Next.js, Go API, PostgreSQL — run as containers. nginx handles SSL termination and reverse proxying. Certbot manages Let's Encrypt certificates.

### Target Environment

| Property | Value |
|----------|-------|
| Domain | `archifex.space` |
| VPS IP | `45.141.102.154` |
| VPS provider | RuVDS |
| OS | Ubuntu 22.04 LTS |
| Specs | 1x2.2GHz, 0.5GB RAM, 10GB SSD |
| DNS | Registered at Jino, NS pointed to RuVDS, A record → VPS IP |

**Note:** 0.5GB RAM is tight for 4 Docker containers. If OOM or heavy swapping occurs, upgrade to 2GB+ RAM plan. The spec is designed to work on larger VPS without changes.

---

## 2. Architecture

```
archifex.space (45.141.102.154)
│
└── Docker Compose
    ├── nginx (Alpine, ports 80/443)
    │   ├── / → app:3000 (Next.js)
    │   ├── /api/ → api:8080 (Go API)
    │   ├── /uploads/ → api:8080 (Go API)
    │   ├── /health → api:8080 (Go API)
    │   └── SSL via Let's Encrypt certs
    │
    ├── app (Next.js standalone, internal only)
    │   └── Server-side API calls → http://api:8080
    │
    ├── api (Go binary, internal only)
    │   └── Connects to db:5432
    │
    ├── db (PostgreSQL 16 Alpine, internal only)
    │   └── Data persisted in pgdata volume
    │
    └── certbot (renewal loop every 12h)
        └── Shares cert volumes with nginx
```

**Key decisions:**
- Only nginx exposes ports (80, 443) — all other services are internal
- Browser API calls go through nginx: `https://archifex.space/api/...`
- Next.js server-side calls go direct: `http://api:8080/api/...`
- This matches the existing `app/src/lib/api.ts` dual-URL pattern (`NEXT_PUBLIC_API_URL` for browser, `API_URL` for server)

---

## 3. Files to Create

### `deploy/docker-compose.prod.yml`

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

### `deploy/nginx.conf`

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

### `deploy/.env.example`

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

### `deploy/init-letsencrypt.sh`

One-time script to bootstrap SSL:

1. Start nginx with a temporary self-signed cert (so it can serve the ACME challenge)
2. Run certbot to get the real cert
3. Restart nginx with the real cert

Standard pattern from the [nginx-certbot](https://github.com/wmnnd/nginx-certbot) approach.

---

## 4. Files to Modify

### `app/Dockerfile` — Remove Prisma, add build arg

Current file references `prisma/`, `prisma.config.ts`, and `npx prisma generate` — none of which exist. Fix:

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

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

**Changes:** Removed prisma copy/generate steps. Added `ARG NEXT_PUBLIC_API_URL` so the build bakes in the correct API URL.

### `app/.env.example` — Update to actual env vars

```env
# API URL for browser requests (goes through nginx in production)
NEXT_PUBLIC_API_URL=http://localhost:8080

# API URL for server-side requests (direct in production)
API_URL=http://localhost:8080
```

### `app/docker-compose.yml` — Delete

Stale file from a Prisma-based template. All compose config lives in root `docker-compose.yml` (dev) and `deploy/docker-compose.prod.yml` (prod).

---

## 5. Deployment Workflow

### Initial Deploy (one-time)

```bash
# 1. SSH into VPS
ssh root@45.141.102.154

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone repo
mkdir -p /opt && cd /opt
git clone https://github.com/zemdenalex/portfolio.git archifex
cd archifex

# 4. Create production env
cp deploy/.env.example deploy/.env
nano deploy/.env  # fill in real passwords and secrets

# 5. Bootstrap SSL + start everything
cd deploy
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh

# 6. Verify
curl https://archifex.space/health
```

### Update Deploy (ongoing)

```bash
ssh root@45.141.102.154
cd /opt/archifex
git pull
cd deploy && docker compose -f docker-compose.prod.yml up --build -d
```

### GitHub Actions CI/CD (add later)

Trigger on push to `main`:
1. SSH into VPS
2. `cd /opt/archifex && git pull`
3. `cd deploy && docker compose -f docker-compose.prod.yml up --build -d`

Simple ~15-line workflow, no Docker registry needed. Builds happen on the VPS.

---

## 6. Verification

After deployment, verify:

1. `https://archifex.space` — homepage loads with portfolio data
2. `https://archifex.space/api/health` — returns `{"data":{"status":"ok"}}`
3. `https://archifex.space/en/portfolio` — portfolio grid shows projects
4. `https://archifex.space/en/quiz` — quiz loads root question
5. `https://archifex.space/admin/login` — admin login page renders
6. Admin login with seeded credentials works
7. SSL certificate valid (check browser padlock)
8. HTTP redirects to HTTPS
9. Both `/en/` and `/ru/` locales work

---

## 7. File Summary

| Action | File |
|--------|------|
| Create | `deploy/docker-compose.prod.yml` |
| Create | `deploy/nginx.conf` |
| Create | `deploy/.env.example` |
| Create | `deploy/init-letsencrypt.sh` |
| Fix | `app/Dockerfile` (remove Prisma, add build arg) |
| Fix | `app/.env.example` (update env vars) |
| Delete | `app/docker-compose.yml` (stale) |
