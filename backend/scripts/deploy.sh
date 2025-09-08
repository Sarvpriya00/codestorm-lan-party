#!/bin/bash

# CodeStorm Platform Deployment Script
# This script handles database migrations and system updates

set -e  # Exit on any error

echo "🚀 Starting CodeStorm Platform Deployment..."

# Configuration
BACKUP_DIR="./backups/deployment"
LOG_FILE="./logs/deployment.log"
MIGRATION_LOG="./logs/migration.log"

# Create necessary directories
mkdir -p ./backups/deployment
mkdir -p ./logs
mkdir -p ./uploads

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
handle_error() {
    log "❌ Error occurred during deployment: $1"
    log "🔄 Rolling back changes..."
    # Add rollback logic here if needed
    exit 1
}

# Trap errors
trap 'handle_error "Unexpected error"' ERR

log "📋 Starting deployment process..."

# Step 1: Environment validation
log "🔍 Validating environment..."
if [ ! -f ".env" ]; then
    log "❌ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Check required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log "❌ Required environment variable $var is not set"
        exit 1
    fi
done

log "✅ Environment validation passed"

# Step 2: Install dependencies
log "📦 Installing dependencies..."
npm ci --only=production

# Step 3: Generate Prisma client
log "🔧 Generating Prisma client..."
npx prisma generate

# Step 4: Create backup before migration
log "💾 Creating pre-migration backup..."
BACKUP_FILE="$BACKUP_DIR/pre-migration-$(date +%Y%m%d-%H%M%S).db"
if [ -f "./prisma/dev.db" ]; then
    cp "./prisma/dev.db" "$BACKUP_FILE"
    log "✅ Backup created: $BACKUP_FILE"
else
    log "⚠️  No existing database found, skipping backup"
fi

# Step 5: Run database migrations
log "🗄️  Running database migrations..."
npx prisma migrate deploy 2>&1 | tee -a "$MIGRATION_LOG"

# Step 6: Run data migrations
log "🔄 Running data migrations..."
if [ "$NODE_ENV" != "production" ] || [ "${FORCE_DATA_MIGRATION:-false}" = "true" ]; then
    npm run migrate:status 2>&1 | tee -a "$MIGRATION_LOG"
    
    # Ask user if they want to run data migrations
    if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
        log "🤖 Auto-migration enabled, running all data migrations..."
        npm run migrate:all 2>&1 | tee -a "$MIGRATION_LOG"
    else
        echo "Would you like to run data migrations? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            npm run migrate:all 2>&1 | tee -a "$MIGRATION_LOG"
        else
            log "⏭️  Skipping data migrations"
        fi
    fi
else
    log "⚠️  Production environment detected. Data migrations skipped for safety."
    log "   Run manually with FORCE_DATA_MIGRATION=true if needed."
fi

# Step 7: Seed database (development only)
if [ "$NODE_ENV" = "development" ] && [ "${SEED_DATABASE:-true}" = "true" ]; then
    log "🌱 Seeding database..."
    npm run seed 2>&1 | tee -a "$LOG_FILE"
fi

# Step 8: Build application
log "🏗️  Building application..."
npm run build

# Step 9: Run tests (if not in production)
if [ "$NODE_ENV" != "production" ]; then
    log "🧪 Running tests..."
    npm test 2>&1 | tee -a "$LOG_FILE"
fi

# Step 10: Validate deployment
log "✅ Validating deployment..."

# Check if database is accessible
if npx prisma db pull --print 2>/dev/null | grep -q "model"; then
    log "✅ Database connection successful"
else
    handle_error "Database connection failed"
fi

# Check if build artifacts exist
if [ -f "./dist/index.js" ]; then
    log "✅ Build artifacts found"
else
    handle_error "Build artifacts not found"
fi

# Step 11: Create post-deployment backup
log "💾 Creating post-deployment backup..."
POST_BACKUP_FILE="$BACKUP_DIR/post-migration-$(date +%Y%m%d-%H%M%S).db"
if [ -f "./prisma/dev.db" ]; then
    cp "./prisma/dev.db" "$POST_BACKUP_FILE"
    log "✅ Post-deployment backup created: $POST_BACKUP_FILE"
fi

# Step 12: Cleanup old backups
log "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete 2>/dev/null || true

log "🎉 Deployment completed successfully!"
log "📊 Deployment Summary:"
log "   - Environment: $NODE_ENV"
log "   - Database: $(basename "$DATABASE_URL")"
log "   - Backup: $POST_BACKUP_FILE"
log "   - Log: $LOG_FILE"

echo ""
echo "🚀 CodeStorm Platform is ready!"
echo "📝 Check logs at: $LOG_FILE"
echo "🗄️  Migration logs at: $MIGRATION_LOG"

# Display next steps
echo ""
echo "Next steps:"
echo "1. Start the server: npm start"
echo "2. Check system status: npm run migrate:status"
echo "3. Monitor logs: tail -f $LOG_FILE"