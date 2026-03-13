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

echo "Database is up - running Prisma migrations..."
npx prisma migrate deploy

echo "Ensuring uploads directory exists..."
mkdir -p uploads/products

echo "Starting application..."
exec node dist/src/main.js
