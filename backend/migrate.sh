#!/bin/sh
set -e

echo "Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run schema.sql
psql "$DATABASE_URL" -f internal/db/schema.sql

echo "Migrations completed successfully!"
