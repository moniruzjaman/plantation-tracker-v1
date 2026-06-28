#!/bin/bash
# ============================================================
# 🌿 Plantation Tracker — Create Develop Branch v2.1
# DAE Kurigram · KrishiAI Team
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

VERSION="2.1.0"
BRANCH_NAME="develop-v2.1"
TAG_NAME="v${VERSION}-dev"

echo -e "${CYAN}🌿 Plantation Tracker — Branch Setup v${VERSION}${NC}"
echo "============================================================"

# Verify we're on main or develop
current_branch=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${current_branch}${NC}"

if [ "$current_branch" != "main" ] && [ "$current_branch" != "develop" ]; then
    echo -e "${YELLOW}⚠️  Warning: You are on '${current_branch}', not main/develop.${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Fetch latest from remote
echo -e "${BLUE}📥 Fetching latest from origin...${NC}"
git fetch origin

# Create and checkout develop-v2.1 branch
echo -e "${BLUE}🌱 Creating branch: ${BRANCH_NAME}${NC}"
git checkout -b "${BRANCH_NAME}"

# ============================================================
# VERSION BUMP
# ============================================================
echo -e "${GREEN}📦 Bumping version to ${VERSION}${NC}"

# Update package.json version
if [ -f "package.json" ]; then
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '${VERSION}';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('✅ package.json updated to ${VERSION}');
    "
fi

# Update version in MapTab component
if [ -f "src/components/MapTab.jsx" ]; then
    sed -i "s/Plantation Tracker v1/Plantation Tracker v${VERSION}/g" src/components/MapTab.jsx
    echo -e "${GREEN}✅ MapTab.jsx version updated${NC}"
fi

# Create version file for backend
if [ -d "backend" ]; then
    echo "${VERSION}" > backend/VERSION
    echo -e "${GREEN}✅ backend/VERSION created${NC}"
fi

# ============================================================
# VERSION COMMIT
# ============================================================
echo ""
echo -e "${GREEN}📦 Committing version bump${NC}"
echo "------------------------------------------------------------"

git add package.json package-lock.json 2>/dev/null || true
git add src/components/MapTab.jsx 2>/dev/null || true
git add backend/VERSION 2>/dev/null || true
git add CHANGELOG.md 2>/dev/null || true

git commit -m "chore(release): bump version to ${VERSION} on develop branch

- Create ${BRANCH_NAME} branch from ${current_branch}
- Update package.json version to ${VERSION}
- Update MapTab component version reference
- Add backend/VERSION tracking file
- Prepare for v2.1 feature development

Refs: RELEASE-${VERSION}"

# ============================================================
# CREATE TAG
# ============================================================
echo ""
echo -e "${GREEN}🏷️  Creating development tag: ${TAG_NAME}${NC}"
git tag -a "${TAG_NAME}" -m "Development baseline for v${VERSION}

Branch: ${BRANCH_NAME}
Created from: ${current_branch}
Date: $(date -u +%Y-%m-%d)"

# ============================================================
# PUSH
# ============================================================
echo ""
echo -e "${BLUE}🚀 Pushing branch and tag to origin...${NC}"
echo "------------------------------------------------------------"

git push -u origin "${BRANCH_NAME}"
git push origin "${TAG_NAME}"

echo ""
echo -e "${GREEN}✅ Branch ${BRANCH_NAME} created and pushed successfully!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "   1. Set branch protection rules for ${BRANCH_NAME}:"
echo "      - Require PR reviews before merging"
echo "      - Require status checks (CI/CD)"
echo "      - Restrict push to maintainers only"
echo ""
echo "   2. Update GitHub Actions workflow to trigger on ${BRANCH_NAME}:"
echo "      branches: [main, develop, ${BRANCH_NAME}]"
echo ""
echo "   3. Start v2.1 feature development:"
echo "      git checkout -b feat/temporal-slider ${BRANCH_NAME}"
echo "      git checkout -b feat/plot-boundaries ${BRANCH_NAME}"
echo "      git checkout -b feat/offline-cache ${BRANCH_NAME}"
echo ""
echo -e "${CYAN}🔗 Branch URL:${NC}"
echo "   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/tree/${BRANCH_NAME}"
echo ""
echo -e "${CYAN}🏷️  Tag URL:${NC}"
echo "   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/tag/${TAG_NAME}"
echo ""
