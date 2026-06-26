# 🌳 Plantation Tracker v1

**"০৫ বছরে ২৫ কোটি বৃক্ষরোপণ" — Tree Plantation Data Collection Portal**

A Bengali-first, offline-capable Progressive Web App (PWA) for DAE field officers to record, monitor, and report tree plantation data under Bangladesh's national 250 million tree plantation programme.

**Live:** [plantation-tracker-v1.vercel.app](https://plantation-tracker-v1.vercel.app)  
**Org:** কৃষি সম্প্রসারণ অধিদপ্তর (DAE) · Ministry of Agriculture, Bangladesh  
**Maintained by:** Abu Md. Moniruzzaman, ADD (Horticulture), DAE Kurigram, 31st BCS Agriculture Cadre

---

## 📱 Features

### Tab 1 — ফর্ম (Form)
- Cascading অঞ্চল → জেলা → উপজেলা dropdowns (full BD geodata, 14 regions / 64 districts)
- Multi-row seedling entry per category: **ফলদ / বনজ / ঔষধি চারা**
- Each seedling row: name, age bracket, seedling count, grafting count
- GPS auto-fetch via Nominatim (latitude/longitude + reverse-geocoded Bengali address)
- Full edit mode — editing from Dashboard routes back to this tab pre-filled
- Bengali inline validation toasts (required fields, mobile format)
- All data persisted to `localStorage` under key `nursery_submissions`

### Tab 2 — ড্যাশবোর্ড (Dashboard + Report)
Two sub-views toggled by a pill switcher:

**ড্যাশবোর্ড view:**
- Stats cards: total entries, unique planters, total seedlings, total grafts
- SVG bar chart: top 6 regions by submission count
- Progress bars: seedling breakdown by category (ফলদ / বনজ / ঔষধি) with %
- National goal progress tracker: X / 25 crore seedlings
- Filterable data table (by region + district) with CSV & JSON export
- KoBo/Server Sync Center: POST to any REST endpoint with optional Bearer token

**রিপোর্ট view:**
- Mobile number lookup — find, edit, or delete your own submissions
- Scrollable full submission list with edit/delete per row

### Tab 3 — ম্যাপ (Map)
- Leaflet map with 3 tile layers: OSM Road / Esri Satellite / OpenTopoMap
- Color-coded circle markers by seedling count (green → blue → orange for 0→5k→10k+)
- Rich popups: planter name, location, date, seedling breakdown grid
- **Mobile scroll guard:** tap-to-activate overlay prevents Leaflet from hijacking page scroll
- Zoom-to-my-location (GPS, drops a marker)
- Region/district filter synced with Dashboard
- NDVI / Google Earth Engine layer planned (panel documented)

### Tab 4 — আমার (My Profile)
- DAE officer profile across 4 collapsible sections:
  1. **ব্যক্তিগত** — name (bn + en), designation, NID, DOB, email, mobile
  2. **পদায়ন** — ministry, department, BCS batch, cadre, division, district, office, posting date
  3. **শিক্ষা** — SSC / HSC / B.Sc Agriculture / MBA details
  4. **অতিরিক্ত** — training, awards, bio, digital presence
- Photo upload (stored as base64 in `localStorage`)
- Persisted under `localStorage` key `dae_officer_profile`
- TXT export of profile + activity summary
- Live submission count pulled from shared `useSubmissions` hook

---

## 🏗️ Architecture

```
src/
├── App.tsx                        # 4-tab SPA shell, mobile bottom-nav + desktop top-nav
│                                  # React.lazy per tab (code-split), AnimatePresence transitions
├── data/
│   └── bdData.ts                  # BD geodata constants, Submission type, localStorage helpers
├── hooks/
│   └── useSubmissions.ts          # Shared hook: polling + StorageEvent for real-time sync
└── components/
    ├── tabs/
    │   ├── FormTab.tsx            # Plantation data entry form
    │   ├── DashboardTab.tsx       # Dashboard + merged Report sub-view
    │   ├── MapTab.tsx             # Leaflet map with scroll guard
    │   └── MyTab.tsx              # DAE officer profile
    ├── NetworkStatus.tsx          # Online/offline detection
    ├── GeolocationIndicator.tsx   # GPS permission state
    ├── WelcomeModal.tsx           # First-run onboarding
    ├── PWAInstaller.tsx           # Add-to-homescreen prompt
    └── SyncToast.tsx              # Offline sync notification
```

### Data Flow
```
FormTab (submit) ──→ localStorage["nursery_submissions"]
                           │
              useSubmissions hook (polling + StorageEvent)
                           │
        ┌──────────────────┼──────────────────┐
   DashboardTab        MapTab              MyTab
   (stats, table,    (markers,          (live count)
    export, sync)     popups)
```

### localStorage Keys
| Key | Content |
|-----|---------|
| `nursery_submissions` | `Submission[]` — all plantation records |
| `dae_officer_profile` | `OfficerProfile` — officer info |
| `sync_endpoint` | Last-used KoBo/API endpoint |
| `sync_token` | Last-used auth token |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion v12) |
| Icons | Lucide React |
| Map | Leaflet 1.9 (via CDN) |
| Build | Vite 6 + Rollup (manual chunks) |
| PWA | vite-plugin-pwa + Workbox (service worker) |
| Mobile App | Capacitor 8 (Android) |
| Deployment | Vercel (auto-deploy on push to `main`) |
| Fonts | Noto Sans Bengali (Google Fonts CDN) |

### Bundle Chunks (production gzip sizes)
| Chunk | Size (gzip) | Loaded |
|-------|-------------|--------|
| `index` (app + geodata) | ~88 KB | Always |
| `vendor-motion` | ~32 KB | Always |
| `vendor-icons` | ~8 KB | Always |
| `FormTab` | ~4 KB | On tap |
| `DashboardTab` | ~5 KB | On tap |
| `MapTab` | ~4 KB | On tap |
| `MyTab` | ~5 KB | On tap |

---

## 🚀 Local Development

```bash
git clone https://github.com/moniruzjaman/plantation-tracker-v1.git
cd plantation-tracker-v1
npm install
npm run dev        # http://localhost:5173
```

### Build
```bash
npm run build      # runs fix-gradle-wrapper.js + logo pipeline + vite build
```

### Deploy (push to GitHub → Vercel auto-deploys)
```bash
# From Termux with PAT:
git remote set-url origin https://YOUR_PAT@github.com/moniruzjaman/plantation-tracker-v1.git
git push origin main
git remote set-url origin https://github.com/moniruzjaman/plantation-tracker-v1.git
```

---

## 📦 PWA / Offline Support

- Service worker auto-registered via vite-plugin-pwa (Workbox `generateSW`)
- Pre-caches all JS/CSS/HTML/icons/manifests at install time
- Runtime caches:
  - **Leaflet CDN** (CSS + JS): `CacheFirst`, 1-year TTL
  - **OpenStreetMap tiles**: `StaleWhileRevalidate`, 500-tile cap, 30-day TTL
- All form data saved to `localStorage` immediately on submit — survives offline/reload
- Offline banner shows in header when `navigator.onLine` is false

### Android APK
A signed Android APK is built via GitHub Actions on push to `main`:
- Capacitor 8 wraps the Vite PWA build
- Signing uses PKCS12 keystore injected via GitHub Secrets
- Outputs: `app-release.apk` artifact in Actions

---

## 🗺️ Geodata Coverage

Full hierarchical BD administrative data in `src/data/bdData.ts`:
- **14 DAE Regions** (অঞ্চল)
- **64 Districts** (জেলা)
- **Upazilas** (উপজেলা) for all districts with field offices

---

## 📋 Submission Data Schema

```typescript
interface Submission {
  id: string;               // timestamp string
  region: string;           // DAE অঞ্চল
  district: string;
  upazila: string;
  nurseryName: string;      // রোপণকারীর নাম
  mobile: string;           // 01XXXXXXXXX
  caretakerName?: string;   // মনিটরিং অফিসার
  caretakerMobile?: string;
  address?: string;         // reverse-geocoded or manual
  geoLocation?: string;     // "lat, lng"
  plantingDate?: string;    // YYYY-MM-DD
  remarks?: string;
  submittedAt?: string;     // ISO 8601
  synced?: boolean;
  fruitSeedlings?: SeedlingEntry[];    // ফলদ
  forestSeedlings?: SeedlingEntry[];   // বনজ
  medicinalSeedlings?: SeedlingEntry[]; // ঔষধি
}

interface SeedlingEntry {
  name: string;         // from SEEDLING_NAMES list
  age: string;          // AGE_OPTS bracket
  count: string;        // চারার সংখ্যা
  graftingCount: string; // কলমের সংখ্যা
}
```

---

## 🔄 Changelog

### v2.0.0 — Full React SPA Refactor (2026-06)
- **Removed:** Admin tab, iframe to `legacy-nursery.html`, `MobileControlCenter` overlay
- **Added:** Native React FormTab with cascading BD geo selectors
- **Added:** DashboardTab with merged Report sub-view, KoBo sync center
- **Added:** Leaflet MapTab with mobile scroll guard, tile switcher, NDVI info
- **Added:** DAE Officer profile (MyTab) with 4 sections, photo upload, TXT export
- **Added:** `src/data/bdData.ts` — full BD geodata constants + TypeScript types
- **Added:** `src/hooks/useSubmissions.ts` — shared real-time localStorage hook
- **Fixed:** Mobile scroll hijack by Leaflet — tap-to-activate overlay
- **Fixed:** Sticky Save button hidden under mobile bottom nav
- **Fixed:** `vite` duplicated in deps + devDeps
- **Fixed:** Build tools (`@tailwindcss/vite`, `@vitejs/plugin-react`) moved from deps → devDeps
- **Fixed:** Dead dependencies `express`, `dotenv` removed
- **Perf:** Vite manual chunks (`vendor-react`, `vendor-motion`, `vendor-icons`)
- **Perf:** `React.lazy` per tab — tab code loads on demand

### v1.x — Legacy iframe Architecture (2025-11 to 2026-05)
- Capacitor + Vite wrapper around `public/legacy-nursery.html`
- Vanilla JS form, Chart.js charts, Leaflet map all inside single HTML file
- Admin tab with password protection
- Android APK CI via GitHub Actions + PKCS12 keystore signing

---

## 📝 License

Government of Bangladesh — কৃষি সম্প্রসারণ অধিদপ্তর  
For official DAE use only.
