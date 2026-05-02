# Admin Runbook

## Pre-deploy: Backup quiz tables before migration 006

Run this ONCE before deploying Slice 2 (quiz scoring redesign):

```bash
ssh root@archifex.space \
  'mkdir -p /opt/archifex/backups && \
   cd /opt/archifex/deploy && \
   docker compose -f docker-compose.prod.yml exec -T db sh -c \
     "pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB -t quiz_nodes -t quiz_options" \
   > /opt/archifex/backups/quiz-pre-006-$(date +%Y%m%d-%H%M).sql'
```

Verify the backup was created:
```bash
ssh root@archifex.space 'ls -lh /opt/archifex/backups/'
```

## Rollback: Quiz scoring (Slice 2)

If Slice 2 needs to be rolled back:
1. `git revert <merge-sha>` on the fixes branch
2. Redeploy API
3. Restore quiz content from backup:
```bash
ssh root@archifex.space \
  'cd /opt/archifex/deploy && \
   docker compose -f docker-compose.prod.yml exec -T db sh -c \
     "psql -U \$POSTGRES_USER -d \$POSTGRES_DB" \
   < /opt/archifex/backups/quiz-pre-006-YYYYMMDD-HHMM.sql'
```

## Admin password reset

To reset the admin password (e.g. if you can't log in):

1. Set environment variables in `.env`:
   ```
   ADMIN_EMAIL=your@email.com
   ADMIN_PASSWORD=your-new-password
   ```
2. Run:
   ```bash
   make admin-reset-prod
   ```
   This executes `/admin-reset` inside the prod API container using current `.env` values.
