#!/bin/bash

# =============================================================================
# SYNERGIZE BACKEND DEPLOYMENT SCRIPT
# =============================================================================
# Run this script on your production server to deploy the Laravel backend
# Usage: ./deploy-backend.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SYNERGIZE BACKEND DEPLOYMENT${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration - CHANGE THESE FOR YOUR SERVER
DEPLOY_PATH="/var/www/synergize/backend"
REPO_URL="your-git-repo-url"  # Change this
BRANCH="main"

# Check if this is first deployment
if [ ! -d "$DEPLOY_PATH" ]; then
    echo -e "${YELLOW}First deployment detected. Please run first-time-setup.sh instead.${NC}"
    exit 1
fi

cd "$DEPLOY_PATH"

echo -e "\n${YELLOW}[1/8] Enabling maintenance mode...${NC}"
php artisan down --retry=60

echo -e "\n${YELLOW}[2/8] Pulling latest changes...${NC}"
git fetch origin
git reset --hard origin/$BRANCH

echo -e "\n${YELLOW}[3/8] Installing Composer dependencies...${NC}"
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

echo -e "\n${YELLOW}[4/8] Running database migrations...${NC}"
php artisan migrate --force

echo -e "\n${YELLOW}[5/8] Clearing and rebuilding caches...${NC}"
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache

echo -e "\n${YELLOW}[6/8] Restarting queue workers...${NC}"
php artisan queue:restart

echo -e "\n${YELLOW}[7/8] Setting permissions...${NC}"
chown -R www-data:www-data storage bootstrap/cache
chmod -R 755 storage bootstrap/cache

echo -e "\n${YELLOW}[8/8] Disabling maintenance mode...${NC}"
php artisan up

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"

# Optional: Restart PHP-FPM
# sudo systemctl restart php8.2-fpm

# Optional: Restart Nginx
# sudo systemctl restart nginx

echo -e "\nDeployment finished at $(date)"
