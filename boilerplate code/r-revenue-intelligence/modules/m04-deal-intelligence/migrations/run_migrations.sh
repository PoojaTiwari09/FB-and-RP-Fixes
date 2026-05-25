#!/bin/bash
set -e
PGPASSWORD="$POSTGRES_PASSWORD"
for f in /docker-entrypoint-initdb.d/*.sql; do
  echo "Running $f..."
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done
echo "All migrations complete."
