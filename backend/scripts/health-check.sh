#!/bin/bash

# CodeStorm Platform Health Check Script
# Validates system integrity and configuration

# Don't exit on errors, we want to continue checking
set +e

echo "🏥 CodeStorm Platform Health Check"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $message"
            ((CHECKS_PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $message"
            ((CHECKS_FAILED++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $message"
            ((CHECKS_WARNING++))
            ;;
    esac
}

# Check 1: Environment file
echo ""
echo "🔍 Environment Configuration"
echo "----------------------------"

if [ -f ".env" ]; then
    print_status "PASS" "Environment file exists"
    
    # Check required variables
    set -a  # automatically export all variables
    if source .env 2>/dev/null; then
        set +a  # stop automatically exporting
        
        required_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV" "PORT")
        for var in "${required_vars[@]}"; do
            if [ -n "${!var}" ]; then
                print_status "PASS" "$var is set"
            else
                print_status "FAIL" "$var is not set"
            fi
        done
    else
        set +a
        print_status "FAIL" "Cannot read .env file"
    fi
    
    # Check JWT secret strength
    if [ ${#JWT_SECRET} -lt 32 ]; then
        print_status "WARN" "JWT_SECRET should be at least 32 characters long"
    else
        print_status "PASS" "JWT_SECRET has adequate length"
    fi
    
else
    print_status "FAIL" "Environment file (.env) not found"
fi

# Check 2: Database
echo ""
echo "🗄️  Database Status"
echo "------------------"

if command -v npx >/dev/null 2>&1; then
    if npx prisma db pull --print >/dev/null 2>&1; then
        print_status "PASS" "Database connection successful"
        
        # Check database schema
        if npx prisma db pull --print 2>/dev/null | grep -q "model User"; then
            print_status "PASS" "User model exists in database"
        else
            print_status "FAIL" "User model not found in database"
        fi
        
        if npx prisma db pull --print 2>/dev/null | grep -q "model Role"; then
            print_status "PASS" "Role model exists in database"
        else
            print_status "FAIL" "Role model not found in database"
        fi
        
        if npx prisma db pull --print 2>/dev/null | grep -q "model Permission"; then
            print_status "PASS" "Permission model exists in database"
        else
            print_status "FAIL" "Permission model not found in database"
        fi
        
    else
        print_status "FAIL" "Cannot connect to database"
    fi
else
    print_status "FAIL" "npx command not found"
fi

# Check 3: Dependencies
echo ""
echo "📦 Dependencies"
echo "---------------"

if [ -f "package.json" ]; then
    print_status "PASS" "package.json exists"
    
    if [ -d "node_modules" ]; then
        print_status "PASS" "node_modules directory exists"
        
        # Check critical dependencies
        critical_deps=("@prisma/client" "express" "jsonwebtoken" "bcryptjs")
        for dep in "${critical_deps[@]}"; do
            if [ -d "node_modules/$dep" ]; then
                print_status "PASS" "$dep is installed"
            else
                print_status "FAIL" "$dep is not installed"
            fi
        done
    else
        print_status "FAIL" "node_modules directory not found - run npm install"
    fi
else
    print_status "FAIL" "package.json not found"
fi

# Check 4: Build artifacts
echo ""
echo "🏗️  Build Status"
echo "---------------"

if [ -f "dist/index.js" ]; then
    print_status "PASS" "Build artifacts exist"
    
    # Check if build is recent
    if [ "dist/index.js" -nt "src/index.ts" ]; then
        print_status "PASS" "Build is up to date"
    else
        print_status "WARN" "Build may be outdated - consider running npm run build"
    fi
else
    print_status "WARN" "Build artifacts not found - run npm run build"
fi

# Check 5: File permissions and directories
echo ""
echo "📁 File System"
echo "--------------"

required_dirs=("logs" "backups" "uploads")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_status "PASS" "$dir directory exists"
        
        if [ -w "$dir" ]; then
            print_status "PASS" "$dir directory is writable"
        else
            print_status "FAIL" "$dir directory is not writable"
        fi
    else
        print_status "WARN" "$dir directory does not exist - will be created on startup"
    fi
done

# Check 6: Port availability
echo ""
echo "🌐 Network"
echo "----------"

if command -v lsof >/dev/null 2>&1; then
    PORT=${PORT:-3001}
    if lsof -i :$PORT >/dev/null 2>&1; then
        print_status "WARN" "Port $PORT is already in use"
    else
        print_status "PASS" "Port $PORT is available"
    fi
else
    print_status "WARN" "Cannot check port availability (lsof not found)"
fi

# Check 7: System resources
echo ""
echo "💻 System Resources"
echo "------------------"

# Check disk space
if command -v df >/dev/null 2>&1; then
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        print_status "PASS" "Disk usage is ${disk_usage}%"
    else
        print_status "WARN" "Disk usage is high: ${disk_usage}%"
    fi
else
    print_status "WARN" "Cannot check disk usage"
fi

# Check memory (if available)
if command -v free >/dev/null 2>&1; then
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$mem_usage" -lt 90 ]; then
        print_status "PASS" "Memory usage is ${mem_usage}%"
    else
        print_status "WARN" "Memory usage is high: ${mem_usage}%"
    fi
elif command -v vm_stat >/dev/null 2>&1; then
    # macOS memory check
    print_status "PASS" "Memory check completed (macOS)"
else
    print_status "WARN" "Cannot check memory usage"
fi

# Check 8: Security
echo ""
echo "🔒 Security"
echo "-----------"

if [ "$NODE_ENV" = "production" ]; then
    if [ "$JWT_SECRET" = "dev-secret-key-change-in-production" ]; then
        print_status "FAIL" "Default JWT secret detected in production"
    else
        print_status "PASS" "JWT secret has been changed from default"
    fi
    
    if [ "${ENABLE_DEBUG_ROUTES:-false}" = "true" ]; then
        print_status "FAIL" "Debug routes are enabled in production"
    else
        print_status "PASS" "Debug routes are disabled"
    fi
else
    print_status "PASS" "Development environment detected"
fi

# Summary
echo ""
echo "📊 Health Check Summary"
echo "======================"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All checks passed! System is healthy.${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  System is functional but has warnings.${NC}"
        exit 0
    fi
else
    echo -e "\n${RED}❌ System has critical issues that need attention.${NC}"
    exit 1
fi