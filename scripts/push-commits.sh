#!/bin/bash
# ============================================================
# 🌿 Plantation Tracker — MapTab Enhancement
# Smart Git Commit & Push Script
# DAE Kurigram · KrishiAI Team
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌿 Plantation Tracker — MapTab Enhancement Pipeline${NC}"
echo "============================================================"

# Check git status
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

# Verify branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${RED}❌ Direct commits to main are blocked. Please use feature branch workflow.${NC}"
    echo "   git checkout -b feat/maptab-enhancement"
    exit 1
fi

# ============================================================
# PHASE 1: Core NDVI Mode + Layer Switcher
# ============================================================
echo ""
echo -e "${GREEN}📦 PHASE 1: Core NDVI Default Mode + Layer Switcher${NC}"
echo "------------------------------------------------------------"

# Stage only MapTab.jsx changes for Phase 1
git add src/components/MapTab.jsx
git add src/styles/MapTab.css

git commit -m "feat(maptab): initialize NDVI default active mode

- Set useState('ndvi') as initial activeLayer state
- Add semi-transparent satellite underlay (opacity 0.4) for NDVI/EVI
- Implement key={activeLayer} remount strategy for TileLayer
- Add horizontal pill strip layer switcher (NDVI/EVI/স্যাটেলাইট/মানচিত্র)
- Active state: dark-green bg + green border
- Full keyboard accessibility (aria-checked, tabIndex, onKeyDown)
- Responsive design with flex-wrap

Refs: MAP-001"

# ============================================================
# PHASE 2: Cloud Pipeline Button
# ============================================================
echo ""
echo -e "${GREEN}📦 PHASE 2: Cloud Pipeline Run Button${NC}"
echo "------------------------------------------------------------"

# No new files — same component, but we amend to show logical separation
# In practice, you'd develop these in separate commits
git commit --amend -m "feat(maptab): initialize NDVI default active mode

- Set useState('ndvi') as initial activeLayer state
- Add semi-transparent satellite underlay (opacity 0.4) for NDVI/EVI
- Implement key={activeLayer} remount strategy for TileLayer
- Add horizontal pill strip layer switcher (NDVI/EVI/স্যাটেলাইট/মানচিত্র)
- Active state: dark-green bg + green border
- Full keyboard accessibility (aria-checked, tabIndex, onKeyDown)

feat(pipeline): add cloud pipeline run button with state machine

- 4 visual states: idle(☁️)/running(⚙️)/success(✅)/error(⚠️)
- Amber pulse ring animation for running state
- Calls VITE_GEE_PIPELINE_URL with bounds, date_from, date_to, indices
- 2s mock fallback when env var absent (demo mode)
- Auto-reset to idle after 8s via useRef timeout
- Memoized callbacks to prevent unnecessary re-renders

Refs: MAP-001, MAP-002"

# ============================================================
# PHASE 3: NDVI Legend + Result Overlay
# ============================================================
echo ""
echo -e "${GREEN}📦 PHASE 3: NDVI Legend + Result Overlay${NC}"
echo "------------------------------------------------------------"

git commit --amend -m "feat(maptab): initialize NDVI default active mode

- Set useState('ndvi') as initial activeLayer state
- Add semi-transparent satellite underlay (opacity 0.4) for NDVI/EVI
- Implement key={activeLayer} remount strategy for TileLayer
- Add horizontal pill strip layer switcher (NDVI/EVI/স্যাটেলাইট/মানচিত্র)
- Active state: dark-green bg + green border
- Full keyboard accessibility (aria-checked, tabIndex, onKeyDown)

feat(pipeline): add cloud pipeline run button with state machine

- 4 visual states: idle(☁️)/running(⚙️)/success(✅)/error(⚠️)
- Amber pulse ring animation for running state
- Calls VITE_GEE_PIPELINE_URL with bounds, date_from, date_to, indices
- 2s mock fallback when env var absent (demo mode)
- Auto-reset to idle after 8s via useRef timeout

feat(analytics): add NDVI legend and result overlay

- Floating legend (bottom-left) with 5 Bengali value bands
  (নগ্ন ভূমি → বিরল → মধ্যম → ঘন সবুজ → অতি ঘন)
- Toggle via 📊 button in top-right bar
- Auto-hidden when satellite/OSM layer active
- ResultOverlay slides in from top-right after pipeline success
- Color-coded values: green/amber/red based on thresholds
- Shows: গড় NDVI, সুস্থ%, চাপগ্রস্ত%, নগ্ন%, মোট হেক্টর

Refs: MAP-001, MAP-002, MAP-003"

# ============================================================
# PHASE 4: Config + Dependencies
# ============================================================
echo ""
echo -e "${GREEN}📦 PHASE 4: Environment Config + Dependencies${NC}"
echo "------------------------------------------------------------"

# Stage config files
git add package.json package-lock.json .env.local.example index.html
git add .github/workflows/deploy.yml

git commit -m "chore(config): add environment variables and CI/CD pipeline

- Add VITE_GEE_PIPELINE_URL and VITE_SENTINEL_HUB_INSTANCE_ID to .env.local.example
- Install react-leaflet + leaflet dependencies
- Add Hind Siliguri Bengali font to index.html
- Configure GitHub Actions workflow for Vercel deployment
  - Lint + Prettier checks
  - Unit test execution with coverage
  - Staging deploy on develop branch push
  - Production deploy on main branch merge
  - Lighthouse CI audit on staging
  - Slack notification on success/failure
- Path-filtered triggers for MapTab-related changes

Refs: MAP-004"

# ============================================================
# PHASE 5: Backend Scaffold
# ============================================================
echo ""
echo -e "${GREEN}📦 PHASE 5: GEE Cloud Function Scaffold${NC}"
echo "------------------------------------------------------------"

git add backend/main.py backend/requirements.txt backend/README.md

git commit -m "docs(backend): scaffold GEE cloud function for NDVI pipeline

- Add main.py Cloud Function with run_ndvi_pipeline handler
- Sentinel-2 SR HARMONIZED collection filtering
  - Cloud cover < 20%
  - Date range + bounds filtering
- NDVI calculation: normalizedDifference(B8, B4)
- EVI calculation: 2.5*(NIR-RED)/(NIR+6*RED-7.5*BLUE+1)
- Stats: mean + percentile(10, 90) via reduceRegion
- Health metrics: healthy%, stress%, bare% derived from NDVI mean
- Area calculation in hectares
- JSON response with ndvi_mean, evi_mean, area_ha, health percentages

Refs: MAP-005"

# ============================================================
# PUSH
# ============================================================
echo ""
echo -e "${BLUE}🚀 Pushing to origin/${CURRENT_BRANCH}...${NC}"
echo "------------------------------------------------------------"

git push -u origin "$CURRENT_BRANCH"

echo ""
echo -e "${GREEN}✅ All commits pushed successfully!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Open PR: ${YELLOW}https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/compare/main...${CURRENT_BRANCH}${NC}"
echo "   2. Request review from @krishiai-team"
echo "   3. Merge to develop → staging deploy"
echo "   4. Merge to main → production deploy"
echo ""
echo -e "${BLUE}🔐 Required secrets in GitHub:${NC}"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo "   - SLACK_WEBHOOK_URL (optional)"
echo ""
