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
