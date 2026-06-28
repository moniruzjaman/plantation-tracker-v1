#!/bin/bash
# ============================================================
# 🌿 Plantation Tracker — Create PR: develop-v2.1 → main
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
SOURCE_BRANCH="develop-v2.1"
TARGET_BRANCH="main"

echo -e "${CYAN}🌿 Plantation Tracker — PR Creation v${VERSION}${NC}"
echo "============================================================"

# Verify gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found${NC}"
    echo "   Install: https://cli.github.com/"
    exit 1
fi

# Verify authentication
echo -e "${BLUE}🔐 Verifying GitHub authentication...${NC}"
gh auth status || {
    echo -e "${YELLOW}⚠️  Not authenticated. Running gh auth login...${NC}"
    gh auth login
}

# Get repo info
REPO_INFO=$(gh repo view --json url,owner,name --jq '.owner.login + "/" + .name')
echo -e "${GREEN}✅ Repository: ${REPO_INFO}${NC}"

# Verify we're on the source branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "$SOURCE_BRANCH" ]; then
    echo -e "${YELLOW}⚠️  Current branch is '${current_branch}', not ${SOURCE_BRANCH}${NC}"
    echo -e "${BLUE}📥 Checking out ${SOURCE_BRANCH}...${NC}"
    git checkout "$SOURCE_BRANCH"
    git pull origin "$SOURCE_BRANCH"
fi

# Ensure branch is up to date
echo -e "${BLUE}📥 Pulling latest from origin/${SOURCE_BRANCH}...${NC}"
git pull origin "$SOURCE_BRANCH"

# Check if PR already exists
echo -e "${BLUE}🔍 Checking for existing PR...${NC}"
EXISTING_PR=$(gh pr list --base "$TARGET_BRANCH" --head "$SOURCE_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")

if [ -n "$EXISTING_PR" ] && [ "$EXISTING_PR" != "null" ]; then
    echo -e "${YELLOW}⚠️  PR #${EXISTING_PR} already exists${NC}"
    echo -e "${BLUE}🔄 Updating PR instead...${NC}"
    gh pr edit "$EXISTING_PR"         --title "🌿 Release v${VERSION}: MapTab Enhancement"         --body-file - << 'EOF'
## 🌿 Plantation Tracker v2.1 — MapTab Enhancement

### 📋 Summary
Complete NDVI/EVI visualization overhaul for field officers in Kurigram. Adds cloud pipeline integration, Bengali-localized UI, and responsive analytics overlay.

### ✨ What's New

| Feature | Status | Commit |
|---------|--------|--------|
| NDVI default active mode | ✅ | `feat(maptab)` |
| Horizontal layer switcher (Bengali) | ✅ | `feat(maptab)` |
| Cloud pipeline run button (4 states) | ✅ | `feat(pipeline)` |
| Result overlay with health metrics | ✅ | `feat(analytics)` |
| NDVI legend with Bengali bands | ✅ | `feat(analytics)` |
| Responsive + dark mode + reduced motion | ✅ | `feat(maptab)` |
| GEE Cloud Function backend | ✅ | `docs(backend)` |
| GitHub Actions CI/CD pipeline | ✅ | `chore(config)` |

### 🧪 Testing
- [x] Local dev server (`npm run dev`)
- [x] Demo mode (no `VITE_GEE_PIPELINE_URL`)
- [x] Mobile responsive (iPhone SE → iPad Pro)
- [x] Keyboard navigation (Tab, Enter, Space)
- [x] Dark mode toggle
- [x] Reduced motion preference

### 🔐 Environment Variables Required
```bash
VITE_GEE_PIPELINE_URL=https://your-cloud-function.cloudfunctions.net/run_ndvi_pipeline
VITE_SENTINEL_HUB_INSTANCE_ID=your-sh-instance-id  # optional
```

### 📁 Files Changed
```
src/components/MapTab.jsx      # Main component (all features)
src/styles/MapTab.css          # Complete stylesheet
backend/main.py                # GEE Cloud Function
.github/workflows/deploy.yml   # CI/CD pipeline
package.json                   # react-leaflet + leaflet
index.html                     # Hind Siliguri font
```

### 🚀 Deployment
- **Staging**: Auto-deploys on `develop-v2.1` push
- **Production**: Merges to `main` trigger production deploy

### 📝 Checklist
- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] Changes are well-commented
- [x] No console errors in production build
- [x] Accessibility (a11y) verified
- [x] Performance budget maintained

### 🔗 Related
- Closes #MAP-001, #MAP-002, #MAP-003
- Backend: `run_ndvi_pipeline` Cloud Function
- Docs: [README.md](../blob/main/README.md)

---
**Reviewers**: @krishiai-frontend-leads @krishiai-backend-leads
**Labels**: `enhancement`, `v2.1`, `maptab`, `ready-for-review`
EOF

    echo ""
    echo -e "${GREEN}✅ PR #${EXISTING_PR} updated successfully!${NC}"
    PR_URL=$(gh pr view "$EXISTING_PR" --json url --jq '.url')
    echo -e "${CYAN}🔗 ${PR_URL}${NC}"
    exit 0
fi

# ============================================================
# CREATE NEW PR
# ============================================================
echo ""
echo -e "${GREEN}📦 Creating new PR: ${SOURCE_BRANCH} → ${TARGET_BRANCH}${NC}"
echo "------------------------------------------------------------"

PR_BODY=$(cat << 'EOF'
## 🌿 Plantation Tracker v2.1 — MapTab Enhancement

### 📋 Summary
Complete NDVI/EVI visualization overhaul for field officers in Kurigram. Adds cloud pipeline integration, Bengali-localized UI, and responsive analytics overlay.

### ✨ What's New

| Feature | Status | Commit |
|---------|--------|--------|
| NDVI default active mode | ✅ | `feat(maptab)` |
| Horizontal layer switcher (Bengali) | ✅ | `feat(maptab)` |
| Cloud pipeline run button (4 states) | ✅ | `feat(pipeline)` |
| Result overlay with health metrics | ✅ | `feat(analytics)` |
| NDVI legend with Bengali bands | ✅ | `feat(analytics)` |
| Responsive + dark mode + reduced motion | ✅ | `feat(maptab)` |
| GEE Cloud Function backend | ✅ | `docs(backend)` |
| GitHub Actions CI/CD pipeline | ✅ | `chore(config)` |

### 🧪 Testing
- [x] Local dev server (`npm run dev`)
- [x] Demo mode (no `VITE_GEE_PIPELINE_URL`)
- [x] Mobile responsive (iPhone SE → iPad Pro)
- [x] Keyboard navigation (Tab, Enter, Space)
- [x] Dark mode toggle
- [x] Reduced motion preference

### 🔐 Environment Variables Required
```bash
VITE_GEE_PIPELINE_URL=https://your-cloud-function.cloudfunctions.net/run_ndvi_pipeline
VITE_SENTINEL_HUB_INSTANCE_ID=your-sh-instance-id  # optional
```

### 📁 Files Changed
```
src/components/MapTab.jsx      # Main component (all features)
src/styles/MapTab.css          # Complete stylesheet
backend/main.py                # GEE Cloud Function
.github/workflows/deploy.yml   # CI/CD pipeline
package.json                   # react-leaflet + leaflet
index.html                     # Hind Siliguri font
```

### 🚀 Deployment
- **Staging**: Auto-deploys on `develop-v2.1` push
- **Production**: Merges to `main` trigger production deploy

### 📝 Checklist
- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] Changes are well-commented
- [x] No console errors in production build
- [x] Accessibility (a11y) verified
- [x] Performance budget maintained

### 🔗 Related
- Closes #MAP-001, #MAP-002, #MAP-003
- Backend: `run_ndvi_pipeline` Cloud Function
- Docs: [README.md](../blob/main/README.md)

---
**Reviewers**: @krishiai-frontend-leads @krishiai-backend-leads
**Labels**: `enhancement`, `v2.1`, `maptab`, `ready-for-review`
EOF
)

# Create PR using gh CLI
PR_URL=$(gh pr create     --base "$TARGET_BRANCH"     --head "$SOURCE_BRANCH"     --title "🌿 Release v${VERSION}: MapTab Enhancement"     --body "$PR_BODY"     --reviewer "krishiai-frontend-leads,krishiai-backend-leads"     --label "enhancement,v2.1,maptab,ready-for-review"     --draft false)

echo ""
echo -e "${GREEN}✅ PR created successfully!${NC}"
echo ""
echo -e "${CYAN}🔗 ${PR_URL}${NC}"
echo ""

# Extract PR number for follow-up
PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')

# ============================================================
# POST-CREATE ACTIONS
# ============================================================
echo -e "${BLUE}📋 Post-creation actions${NC}"
echo "------------------------------------------------------------"

# Watch CI checks
echo -e "${BLUE}⏳ Watching CI checks (Ctrl+C to skip)...${NC}"
gh pr checks "$PR_NUMBER" --watch || true

echo ""
echo -e "${GREEN}✅ PR #${PR_NUMBER} is ready for review!${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "   1. Share PR link with reviewers"
echo "   2. Monitor CI checks: gh pr checks ${PR_NUMBER} --watch"
echo "   3. Address review feedback"
echo "   4. Merge when approved: gh pr merge ${PR_NUMBER} --squash --delete-branch"
echo ""
echo -e "${CYAN}🔗 PR URL:${NC} ${PR_URL}"
echo ""
