#!/bin/bash

# =============================================================================
# SYNERGIZE BACKUP SCRIPT
# =============================================================================
# Creates backups of database and uploaded files
# Usage: ./backup.sh
# Recommended: Run daily via cron
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration - CHANGE THESE
BACKUP_DIR="/var/backups/synergize"
DEPLOY_PATH="/var/www/synergize"
DB_NAME="synergize"
DB_USER="synergize_user"
RETENTION_DAYS=30  # Keep backups for 30 days

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Timestamp for backup files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SYNERGIZE BACKUP${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Timestamp: $TIMESTAMP"

# =============================================================================
# DATABASE BACKUP
# =============================================================================
echo -e "\n${YELLOW}[1/3] Backing up database...${NC}"
DB_BACKUP_FILE="$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

PGPASSWORD="$DB_PASS" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Database backup created: $DB_BACKUP_FILE ($DB_SIZE)${NC}"
else
    echo -e "${RED}Database backup failed!${NC}"
    exit 1
fi

# =============================================================================
# STORAGE BACKUP (uploaded files)
# =============================================================================
echo -e "\n${YELLOW}[2/3] Backing up storage files...${NC}"
STORAGE_BACKUP_FILE="$BACKUP_DIR/storage_$TIMESTAMP.tar.gz"

if [ -d "$DEPLOY_PATH/backend/storage/app/public" ]; then
    tar -czf "$STORAGE_BACKUP_FILE" -C "$DEPLOY_PATH/backend/storage/app" public
    STORAGE_SIZE=$(du -h "$STORAGE_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Storage backup created: $STORAGE_BACKUP_FILE ($STORAGE_SIZE)${NC}"
else
    echo -e "${YELLOW}No public storage files to backup${NC}"
fi

# =============================================================================
# ENV BACKUP
# =============================================================================
echo -e "\n${YELLOW}[3/3] Backing up environment files...${NC}"
ENV_BACKUP_FILE="$BACKUP_DIR/env_$TIMESTAMP.tar.gz"

tar -czf "$ENV_BACKUP_FILE" \
    -C "$DEPLOY_PATH/backend" .env \
    -C "$DEPLOY_PATH/frontend" .env.local 2>/dev/null || true

if [ -f "$ENV_BACKUP_FILE" ]; then
    echo -e "${GREEN}Environment backup created: $ENV_BACKUP_FILE${NC}"
fi

# =============================================================================
# CLEANUP OLD BACKUPS
# =============================================================================
echo -e "\n${YELLOW}Cleaning up backups older than $RETENTION_DAYS days...${NC}"
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$RETENTION_DAYS -delete

REMAINING=$(ls -1 "$BACKUP_DIR" | wc -l)
echo "Remaining backup files: $REMAINING"

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  BACKUP COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Files created:"
ls -lh "$BACKUP_DIR"/*_$TIMESTAMP* 2>/dev/null || echo "  (none)"
echo ""
echo "Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"

# =============================================================================
# OPTIONAL: Upload to remote storage
# =============================================================================
# Uncomment and configure one of these options:

# Option 1: AWS S3
# aws s3 sync "$BACKUP_DIR" s3://your-bucket/synergize-backups/

# Option 2: rsync to remote server
# rsync -avz "$BACKUP_DIR/" user@backup-server:/backups/synergize/

# Option 3: rclone (supports many cloud providers)
# rclone sync "$BACKUP_DIR" remote:synergize-backups/
