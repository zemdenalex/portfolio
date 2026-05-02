.PHONY: admin-reset admin-reset-prod

# Run admin-reset locally (requires local db + env vars)
admin-reset:
	cd api && go run ./cmd/admin-reset

# Run admin-reset on production server via SSH
admin-reset-prod:
	ssh root@archifex.space 'cd /opt/archifex/deploy && docker compose -f docker-compose.prod.yml exec -T api /admin-reset'
