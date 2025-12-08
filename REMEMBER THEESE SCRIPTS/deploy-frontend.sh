#!/bin/bash

# =============================================================================
# SYNERGIZE FRONTEND DEPLOYMENT SCRIPT
# =============================================================================
# Run this script on your production server to deploy the Next.js frontend
# Usage: ./deploy-frontend.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SYNERGIZE FRONTEND DEPLOYMENT${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration - CHANGE THESE FOR YOUR SERVER
DEPLOY_PATH="/var/www/synergize/frontend"
REPO_URL="your-git-repo-url"  # Change this
BRANCH="main"
PM2_APP_NAME="synergize-frontend"

# Check if this is first deployment
if [ ! -d "$DEPLOY_PATH" ]; then
    echo -e "${YELLOW}First deployment detected. Please run first-time-setup.sh instead.${NC}"
    exit 1
fi

cd "$DEPLOY_PATH"

echo -e "\n${YELLOW}[1/6] Pulling latest changes...${NC}"
git fetch origin
git reset --hard origin/$BRANCH

echo -e "\n${YELLOW}[2/6] Installing dependencies...${NC}"
npm ci --production=false

echo -e "\n${YELLOW}[3/6] Building application...${NC}"
npm run build

echo -e "\n${YELLOW}[4/6] Pruning dev dependencies...${NC}"
npm prune --production

echo -e "\n${YELLOW}[5/6] Restarting PM2 process...${NC}"
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME"
else
    echo -e "${YELLOW}PM2 process not found. Starting new process...${NC}"
    pm2 start npm --name "$PM2_APP_NAME" -- start
    pm2 save
fi

echo -e "\n${YELLOW}[6/6] Checking application status...${NC}"
pm2 status "$PM2_APP_NAME"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\nDeployment finished at $(date)"

# Health check
echo -e "\n${YELLOW}Running health check...${NC}"
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}Health check passed! Application is running.${NC}"
else
    echo -e "${RED}Health check failed! Please check the logs.${NC}"
    pm2 logs "$PM2_APP_NAME" --lines 50
fi
