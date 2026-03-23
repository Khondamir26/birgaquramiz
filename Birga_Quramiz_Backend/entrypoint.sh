#!/bin/sh
set -e

# Extract host and port from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -e 's|.*@||' -e 's|:.*||' -e 's|/.*||')
DB_PORT=$(echo $DATABASE_URL | sed -e 's|.*:||' -e 's|/.*||')
DB_PORT=${DB_PORT:-5432}

echo "Waiting for database at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "Database is unavailable - sleeping..."
  sleep 2
done

if [ "$SKIP_MIGRATION" = "true" ]; then
  echo "Skipping Prisma migrations (SKIP_MIGRATION=true)"
else
  echo "Database is up - running Prisma migrations..."
  npx prisma migrate deploy
fi

echo "Ensuring uploads directory exists..."
mkdir -p uploads/products

echo "Starting application..."
exec node dist/src/main.js
