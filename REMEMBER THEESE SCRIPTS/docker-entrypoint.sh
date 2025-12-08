#!/bin/bash

# =============================================================================
# SYNERGIZE DOCKER ENTRYPOINT
# =============================================================================
# This script runs when the Docker container starts
# Used for Pelican Panel / Docker deployments
# =============================================================================

set -e

echo "=========================================="
echo "  SYNERGIZE CONTAINER STARTUP"
echo "=========================================="

# Wait for database to be ready
echo "Waiting for database..."
MAX_TRIES=30
TRIES=0

while ! php -r "new PDO('pgsql:host=${DB_HOST};port=${DB_PORT:-5432};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ $TRIES -ge $MAX_TRIES ]; then
        echo "ERROR: Database not available after $MAX_TRIES attempts"
        exit 1
    fi
    echo "  Attempt $TRIES/$MAX_TRIES - Database not ready, waiting..."
    sleep 2
done
echo "Database connected!"

# Wait for Redis if configured
if [ -n "$REDIS_HOST" ]; then
    echo "Waiting for Redis..."
    TRIES=0
    while ! php -r "new Redis(); \$r = new Redis(); \$r->connect('${REDIS_HOST}', ${REDIS_PORT:-6379});" 2>/dev/null; do
        TRIES=$((TRIES + 1))
        if [ $TRIES -ge $MAX_TRIES ]; then
            echo "WARNING: Redis not available, continuing without it..."
            break
        fi
        echo "  Attempt $TRIES/$MAX_TRIES - Redis not ready, waiting..."
        sleep 2
    done
    echo "Redis connected!"
fi

cd /var/www/html

# Generate APP_KEY if not set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Clear and cache config
echo "Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link if needed
if [ ! -L "public/storage" ]; then
    echo "Creating storage link..."
    php artisan storage:link
fi

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 755 storage bootstrap/cache

echo "=========================================="
echo "  STARTUP COMPLETE!"
echo "=========================================="

# Start supervisor (which manages PHP-FPM and Nginx)
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
