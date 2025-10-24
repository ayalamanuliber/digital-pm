#!/bin/bash

# 🚀 Automated Setup Script for Worker Login System
# This checks everything and guides you through what's needed

set -e  # Exit on error

echo ""
echo "🚀 =================================="
echo "   WORKER LOGIN SYSTEM SETUP"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project directory${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Checking dependencies...${NC}"
if npm list @vercel/kv date-fns react-hot-toast &> /dev/null; then
    echo -e "${GREEN}✅ All dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Missing dependencies. Installing...${NC}"
    npm install @vercel/kv date-fns react-hot-toast
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

echo ""
echo -e "${BLUE}🔑 Step 2: Checking environment variables...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local doesn't exist${NC}"
    touch .env.local
fi

# Check if KV variables exist
if grep -q "KV_REST_API_URL" .env.local 2>/dev/null; then
    echo -e "${GREEN}✅ Vercel KV variables found${NC}"
    NEEDS_KV_SETUP=false
else
    echo -e "${RED}❌ Vercel KV variables NOT found${NC}"
    NEEDS_KV_SETUP=true
fi

echo ""
echo -e "${BLUE}🔍 Step 3: Checking Vercel connection...${NC}"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not installed${NC}"
    echo "Installing Vercel CLI globally..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if vercel whoami &> /dev/null; then
    echo -e "${GREEN}✅ Logged into Vercel as: $(vercel whoami)${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged into Vercel${NC}"
    echo "Please login now..."
    vercel login
fi

echo ""
echo "=================================="
echo ""

if [ "$NEEDS_KV_SETUP" = true ]; then
    echo -e "${RED}🚨 ACTION REQUIRED:${NC}"
    echo ""
    echo "You need to setup Vercel KV database. It's super easy:"
    echo ""
    echo -e "${YELLOW}1. Open this link:${NC}"
    echo "   https://vercel.com/ayalamanuliber/digital-pm-skku/stores"
    echo ""
    echo -e "${YELLOW}2. Click 'Create Database' → Choose 'KV' → Click 'Create'${NC}"
    echo ""
    echo -e "${YELLOW}3. Connect to ALL environments (Production, Preview, Development)${NC}"
    echo ""
    echo -e "${YELLOW}4. Then run this command:${NC}"
    echo "   vercel env pull .env.local"
    echo ""
    echo "See VERCEL_KV_SETUP.md for detailed instructions with screenshots"
    echo ""
else
    echo -e "${GREEN}🎉 EVERYTHING IS READY!${NC}"
    echo ""
    echo "You can now:"
    echo ""
    echo -e "${BLUE}1. Start development server:${NC}"
    echo "   npm run dev"
    echo ""
    echo -e "${BLUE}2. Or deploy to production (already done):${NC}"
    echo "   https://digital-pm-skku.vercel.app"
    echo ""
    echo -e "${BLUE}3. Test worker login:${NC}"
    echo "   - Add a worker in the admin panel"
    echo "   - Note their PIN"
    echo "   - Go to: https://digital-pm-skku.vercel.app/worker-login"
    echo "   - Enter the PIN"
    echo ""
fi

echo "=================================="
echo ""
echo -e "${GREEN}✅ Setup check complete!${NC}"
echo ""

# Show what's in .env.local (without showing actual values)
echo "Current environment variables:"
if [ -f ".env.local" ]; then
    grep -o '^[^=]*' .env.local | while read -r var; do
        echo "  ✓ $var"
    done
else
    echo "  (none)"
fi

echo ""
echo "Need help? Check these files:"
echo "  - VERCEL_KV_SETUP.md (KV database setup)"
echo "  - WORKER_LOGIN_SETUP.md (complete guide)"
echo "  - DEPLOYMENT_CHECKLIST.md (quick reference)"
echo ""
