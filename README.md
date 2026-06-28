# 🌿 Plantation Tracker — MapTab Enhancement

**DAE Kurigram · KrishiAI Team**

Complete implementation of the MapTab component with NDVI/EVI visualization, cloud pipeline integration, and Bengali-localized UI for field officers in northern Bangladesh.

---

## 📁 Generated Files

| File | Purpose | Commit Phase |
|------|---------|-------------|
| `MapTab.jsx` | Main React component with all features | Phase 1–3 |
| `MapTab.css` | Complete stylesheet (light/dark mode, responsive) | Phase 1–3 |
| `main.py` | GEE Cloud Function backend scaffold | Phase 5 |
| `deploy.yml` | GitHub Actions CI/CD pipeline | Phase 4 |
| `push-commits.sh` | Automated commit script with logical phases | All |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install react-leaflet leaflet
```

### 2. Add Environment Variables

Create `.env.local`:

```bash
VITE_GEE_PIPELINE_URL=https://your-cloud-function.cloudfunctions.net/run_ndvi_pipeline
VITE_SENTINEL_HUB_INSTANCE_ID=your-sh-instance-id   # optional
```

### 3. Add Bengali Font

In `index.html` `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
```

### 4. Import Component + Styles

```jsx
import MapTab from "./components/MapTab";
import "./styles/MapTab.css";
```

---

## 🏗️ Architecture Overview

```
MapTab.jsx
├── LayerSwitcher        # Horizontal pill strip (keyboard accessible)
├── CloudPipelineButton  # 4-state async button with demo fallback
├── ResultOverlay        # Slide-in analytics panel (Bengali labels)
├── NDVILegend          # Floating bottom-left legend (auto-hide)
├── MapBoundsHandler     # Auto-captures viewport bounds for pipeline
└── Leaflet Map
    ├── Base: OSM (opacity 0.4 under vegetation layers)
    └── Active: NASA GIBS WMS (NDVI/EVI) or Esri/ OSM
```

---

## 🔐 GitHub Secrets Required

| Secret | How to Get |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Run `vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same as above |
| `SLACK_WEBHOOK_URL` | Slack Apps → Incoming Webhooks (optional) |

---

## 📋 Commit Strategy

Run `./push-commits.sh` or execute manually:

```bash
# Phase 1: Core features
git add src/components/MapTab.jsx src/styles/MapTab.css
git commit -m "feat(maptab): initialize NDVI default active mode + layer switcher"

# Phase 2: Pipeline button
git commit -m "feat(pipeline): add cloud pipeline run button with state machine"

# Phase 3: Analytics overlay
git commit -m "feat(analytics): add NDVI legend and result overlay"

# Phase 4: Config + CI/CD
git add package.json .env.local.example .github/workflows/
git commit -m "chore(config): add environment variables and CI/CD pipeline"

# Phase 5: Backend
git add backend/
git commit -m "docs(backend): scaffold GEE cloud function for NDVI pipeline"

# Push
git push -u origin feat/maptab-enhancement
```

---

## 🌍 Backend Deployment (GCP Cloud Functions)

```bash
cd backend
gcloud functions deploy run_ndvi_pipeline \
  --runtime python311 \
  --trigger-http \
  --entry-point main \
  --memory 512MB \
  --timeout 120s \
  --allow-unauthenticated
```

---

## ✅ Feature Checklist

- [x] NDVI default active mode with satellite underlay
- [x] Horizontal pill layer switcher (Bengali labels)
- [x] Cloud pipeline button (4 states, demo fallback)
- [x] Result overlay with color-coded health metrics
- [x] NDVI legend with Bengali band labels
- [x] Keyboard accessibility throughout
- [x] Responsive mobile design
- [x] Dark mode support
- [x] Reduced motion support
- [x] CORS-enabled GEE backend
- [ ] Temporal slider (TODO)
- [ ] Plot boundary GeoJSON overlay (TODO)
- [ ] Offline tile caching (TODO)
- [ ] PNG export via html2canvas (TODO)
- [ ] Alert layer for NDVI drop > 15% (TODO)
- [ ] GPS field officer dot (TODO)
- [ ] Sentinel Hub WMS swap (TODO)

---

## 📝 License

MIT — KrishiAI Team, Department of Agricultural Extension, Kurigram
