#!/bin/bash

# =============================================================================
# SYNERGIZE FULL DEPLOYMENT SCRIPT
# =============================================================================
# Deploys both backend and frontend in one command
# Usage: ./deploy-all.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SYNERGIZE FULL DEPLOYMENT${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Deploying Backend...${NC}"
"$SCRIPT_DIR/deploy-backend.sh"

echo -e "\n${YELLOW}Deploying Frontend...${NC}"
"$SCRIPT_DIR/deploy-frontend.sh"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ALL DEPLOYMENTS COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
