#!/bin/bash
# ============================================================
# 🌿 Plantation Tracker v1 — Push to GitHub with PAT
# Target: https://github.com/moniruzjaman/plantation-tracker-v1
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO_URL="https://github.com/moniruzjaman/plantation-tracker-v1"
SOURCE_BRANCH="develop-v2.1"

echo -e "${CYAN}🌿 Plantation Tracker — GitHub Push with PAT${NC}"
echo "============================================================"
echo -e "${BLUE}📍 Target repo: ${REPO_URL}${NC}"
echo -e "${BLUE}📍 Source branch: ${SOURCE_BRANCH}${NC}"
echo ""

# ============================================================
# CHECK PAT
# ============================================================
if [ -z "${GITHUB_PAT:-}" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_PAT environment variable not set${NC}"
    echo ""
    echo -e "${CYAN}Please provide your PAT and press Enter:${NC}"
    read -s GITHUB_PAT
    echo ""

    if [ -z "$GITHUB_PAT" ]; then
        echo -e "${RED}❌ No PAT provided. Exiting.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PAT received (hidden for security)${NC}"

# ============================================================
# VERIFY GIT REPO
# ============================================================
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📁 Initializing git repository...${NC}"
    git init
    git branch -M main
fi

# ============================================================
# CONFIGURE REMOTE WITH PAT
# ============================================================
echo -e "${BLUE}🔗 Configuring remote origin with PAT...${NC}"

# Remove existing remote if present
git remote remove origin 2>/dev/null || true

# Add remote with PAT embedded in URL (secure for this session only)
REMOTE_WITH_PAT="https://moniruzjaman:${GITHUB_PAT}@github.com/moniruzjaman/plantation-tracker-v1.git"
git remote add origin "$REMOTE_WITH_PAT"

echo -e "${GREEN}✅ Remote configured${NC}"

# ============================================================
# VERIFY AUTHENTICATION
# ============================================================
echo -e "${BLUE}🔐 Verifying authentication...${NC}"

# Test with a lightweight API call
if curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${GITHUB_PAT}"     https://api.github.com/repos/moniruzjaman/plantation-tracker-v1 | grep -q "200"; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
else
    echo -e "${RED}❌ Authentication failed. Check your PAT.${NC}"
    echo -e "${YELLOW}💡 Make sure your PAT has 'repo' scope${NC}"
    exit 1
fi

# ============================================================
# STAGE ALL FILES
# ============================================================
echo ""
echo -e "${BLUE}📦 Staging files...${NC}"

# Create directory structure if needed
mkdir -p src/components src/styles backend .github/workflows

# Move generated files to proper locations (if not already there)
[ -f "MapTab.jsx" ] && mv MapTab.jsx src/components/MapTab.jsx
[ -f "MapTab.css" ] && mv MapTab.css src/styles/MapTab.css
[ -f "main.py" ] && mv main.py backend/main.py
[ -f "deploy-v2.1.yml" ] && mv deploy-v2.1.yml .github/workflows/deploy.yml
[ -f "push-commits.sh" ] && mv push-commits.sh scripts/push-commits.sh
[ -f "create-develop-v2.1.sh" ] && mv create-develop-v2.1.sh scripts/create-develop-v2.1.sh
[ -f "create-pr-v2.1.sh" ] && mv create-pr-v2.1.sh scripts/create-pr-v2.1.sh

# Stage everything
git add -A

# Check what's staged
echo -e "${BLUE}📋 Staged files:${NC}"
git status --short

# ============================================================
# COMMIT
# ============================================================
echo ""
echo -e "${BLUE}📝 Creating commit...${NC}"

if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    git commit -m "feat(maptab): complete v2.1 MapTab enhancement

- NDVI default active mode with satellite underlay
- Horizontal Bengali layer switcher (pill strip)
- Cloud pipeline button (4-state: idle/running/success/error)
- Result overlay with health metrics (Bengali labels)
- NDVI legend with 5 color bands (Bengali)
- Responsive + dark mode + reduced motion support
- GEE Cloud Function backend (Sentinel-2 NDVI/EVI)
- GitHub Actions CI/CD with Vercel deployment
- Branch: develop-v2.1

Refs: MAP-001, MAP-002, MAP-003"

    echo -e "${GREEN}✅ Commit created${NC}"
fi

# ============================================================
# PUSH
# ============================================================
echo ""
echo -e "${BLUE}🚀 Pushing to origin/${SOURCE_BRANCH}...${NC}"

# Check if branch exists on remote
if git ls-remote --heads origin "$SOURCE_BRANCH" | grep -q "$SOURCE_BRANCH"; then
    echo -e "${BLUE}📥 Branch exists on remote, pulling first...${NC}"
    git pull origin "$SOURCE_BRANCH" --rebase || {
        echo -e "${RED}❌ Pull failed. Resolve conflicts manually.${NC}"
        exit 1
    }
fi

# Push
git push -u origin "$SOURCE_BRANCH" --force-with-lease

echo ""
echo -e "${GREEN}✅ Push successful!${NC}"

# ============================================================
# VERIFY ON GITHUB
# ============================================================
echo ""
echo -e "${BLUE}🔍 Verifying on GitHub...${NC}"

LATEST_COMMIT=$(curl -s -H "Authorization: Bearer ${GITHUB_PAT}"     "https://api.github.com/repos/moniruzjaman/plantation-tracker-v1/commits/${SOURCE_BRANCH}" |     grep -o '"sha": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$LATEST_COMMIT" ]; then
    echo -e "${GREEN}✅ Latest commit on ${SOURCE_BRANCH}: ${LATEST_COMMIT:0:7}${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify remote commit${NC}"
fi

# ============================================================
# CLEANUP (SECURITY)
# ============================================================
echo ""
echo -e "${BLUE}🧹 Cleaning up PAT from remote URL...${NC}"
git remote set-url origin "https://github.com/moniruzjaman/plantation-tracker-v1.git"
echo -e "${GREEN}✅ PAT removed from remote URL${NC}"

# ============================================================
# NEXT STEPS
# ============================================================
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}🎉 All done! Here's what to do next:${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${GREEN}1. Open PR on GitHub:${NC}"
echo "   ${REPO_URL}/compare/main...${SOURCE_BRANCH}"
echo ""
echo -e "${GREEN}2. Or use GitHub CLI:${NC}"
echo "   gh pr create --base main --head ${SOURCE_BRANCH} --title 'Release v2.1: MapTab Enhancement'"
echo ""
echo -e "${GREEN}3. Or run the PR script:${NC}"
echo "   ./scripts/create-pr-v2.1.sh"
echo ""
echo -e "${CYAN}🔗 Direct PR link:${NC}"
echo "   ${REPO_URL}/compare/main...${SOURCE_BRANCH}"
echo ""
