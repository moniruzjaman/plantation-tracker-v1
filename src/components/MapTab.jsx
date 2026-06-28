import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, Rectangle, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ============================================
// COMMIT 1: Core NDVI Default Active Mode
// ============================================

const NASA_GIBS_MODIS_NDVI = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
const NASA_GIBS_MODIS_EVI = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ESAT_SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const CENTER = [25.8, 89.6]; // Kurigram, Bangladesh
const ZOOM = 12;

// Layer configurations
const LAYERS = {
  ndvi: {
    name: "NDVI",
    label: "🌿 NDVI",
    url: NASA_GIBS_MODIS_NDVI,
    wms: true,
    layers: "MODIS_Terra_NDVI_16Day",
    format: "image/png",
    transparent: true,
    opacity: 1,
    attribution: "NASA GIBS",
  },
  evi: {
    name: "EVI",
    label: "🍃 EVI",
    url: NASA_GIBS_MODIS_EVI,
    wms: true,
    layers: "MODIS_Terra_EVI_16Day",
    format: "image/png",
    transparent: true,
    opacity: 1,
    attribution: "NASA GIBS",
  },
  satellite: {
    name: "স্যাটেলাইট",
    label: "🛰️ স্যাটেলাইট",
    url: ESAT_SAT,
    wms: false,
    attribution: "Esri",
  },
  osm: {
    name: "মানচিত্র",
    label: "🗺️ মানচিত্র",
    url: OSM_URL,
    wms: false,
    attribution: "© OpenStreetMap",
  },
};

// ============================================
// COMMIT 4: NDVI Legend Data
// ============================================

const NDVI_BANDS = [
  { min: -0.2, max: 0.0, color: "#d73027", label: "নগ্ন ভূমি" },
  { min: 0.0, max: 0.2, color: "#fc8d59", label: "বিরল" },
  { min: 0.2, max: 0.4, color: "#fee08b", label: "মধ্যম" },
  { min: 0.4, max: 0.6, color: "#d9ef8b", label: "ঘন সবুজ" },
  { min: 0.6, max: 1.0, color: "#1a9850", label: "অতি ঘন" },
];

// ============================================
// COMMIT 2: Layer Switcher Panel Component
// ============================================

function LayerSwitcher({ activeLayer, onChange }) {
  return (
    <div
      className="layer-switcher"
      role="radiogroup"
      aria-label="মানচিত্র স্তর নির্বাচন করুন"
    >
      {Object.entries(LAYERS).map(([key, config]) => (
        <button
          key={key}
          role="radio"
          aria-checked={activeLayer === key}
          tabIndex={0}
          className={`layer-pill ${activeLayer === key ? "active" : ""}`}
          onClick={() => onChange(key)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange(key);
            }
          }}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// COMMIT 4: NDVI Legend Component
// ============================================

function NDVILegend({ visible }) {
  if (!visible) return null;

  return (
    <div className="ndvi-legend" role="complementary" aria-label="NDVI ব্যাখ্যা">
      <h4>NDVI মান</h4>
      <div className="legend-bands">
        {NDVI_BANDS.map((band, idx) => (
          <div key={idx} className="legend-band">
            <span
              className="color-box"
              style={{ backgroundColor: band.color }}
              aria-hidden="true"
            />
            <span className="band-label">
              {band.label} ({band.min.toFixed(1)}–{band.max.toFixed(1)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMMIT 3: Cloud Pipeline Button
// ============================================

const PIPELINE_STATES = {
  IDLE: "idle",
  RUNNING: "running",
  SUCCESS: "success",
  ERROR: "error",
};

const PIPELINE_ICONS = {
  [PIPELINE_STATES.IDLE]: "☁️",
  [PIPELINE_STATES.RUNNING]: "⚙️",
  [PIPELINE_STATES.SUCCESS]: "✅",
  [PIPELINE_STATES.ERROR]: "⚠️",
};

const PIPELINE_COLORS = {
  [PIPELINE_STATES.IDLE]: "slate",
  [PIPELINE_STATES.RUNNING]: "amber",
  [PIPELINE_STATES.SUCCESS]: "green",
  [PIPELINE_STATES.ERROR]: "red",
};

function CloudPipelineButton({ bounds, onSuccess, onError }) {
  const [state, setState] = useState(PIPELINE_STATES.IDLE);
  const timeoutRef = useRef(null);

  const resetAfterDelay = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setState(PIPELINE_STATES.IDLE);
    }, 8000);
  }, []);

  const handleClick = useCallback(async () => {
    if (state === PIPELINE_STATES.RUNNING) return;

    setState(PIPELINE_STATES.RUNNING);

    const pipelineUrl = import.meta.env.VITE_GEE_PIPELINE_URL;
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - 1);
    const dateTo = new Date();

    const payload = {
      bounds: bounds || [
        [25.7, 89.5],
        [25.9, 89.7],
      ],
      date_from: dateFrom.toISOString().split("T")[0],
      date_to: dateTo.toISOString().split("T")[0],
      indices: ["NDVI", "EVI", "LSWI"],
    };

    try {
      let result;

      if (pipelineUrl) {
        const response = await fetch(pipelineUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        result = await response.json();
      } else {
        // Demo mode: 2s mock
        await new Promise((r) => setTimeout(r, 2000));
        result = {
          ndvi_mean: 0.452,
          evi_mean: 0.381,
          area_ha: 124.5,
          healthy_pct: 38.0,
          stress_pct: 22.0,
          bare_pct: 40.0,
        };
      }

      setState(PIPELINE_STATES.SUCCESS);
      onSuccess?.(result);
    } catch (err) {
      console.error("Pipeline error:", err);
      setState(PIPELINE_STATES.ERROR);
      onError?.(err);
    } finally {
      resetAfterDelay();
    }
  }, [state, bounds, onSuccess, onError, resetAfterDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const colorClass = PIPELINE_COLORS[state];
  const isRunning = state === PIPELINE_STATES.RUNNING;

  return (
    <button
      className={`pipeline-btn ${colorClass} ${isRunning ? "spinning" : ""}`}
      onClick={handleClick}
      disabled={isRunning}
      aria-label={`পাইপলাইন স্ট্যাটাস: ${state}`}
      title="ক্লাউড পাইপলাইন চালান"
    >
      <span className={`icon ${isRunning ? "spin" : ""}`}>
        {PIPELINE_ICONS[state]}
      </span>
      {isRunning && <span className="pulse-ring" aria-hidden="true" />}
    </button>
  );
}

// ============================================
// COMMIT 4: Result Overlay Component
// ============================================

function ResultOverlay({ data, onClose }) {
  if (!data) return null;

  const { ndvi_mean, healthy_pct, stress_pct, bare_pct, area_ha } = data;

  const getHealthColor = (pct) => {
    if (pct >= 50) return "green";
    if (pct >= 25) return "amber";
    return "red";
  };

  const getStressColor = (pct) => {
    if (pct <= 15) return "green";
    if (pct <= 30) return "amber";
    return "red";
  };

  return (
    <div className="result-overlay" role="dialog" aria-label="পাইপলাইন ফলাফল">
      <button className="close-btn" onClick={onClose} aria-label="বন্ধ করুন">
        ✕
      </button>
      <h3>📊 বিশ্লেষণ ফলাফল</h3>
      <div className="result-grid">
        <div className="result-item">
          <span className="label">গড় NDVI</span>
          <span className={`value ${getHealthColor(healthy_pct)}`}>
            {ndvi_mean?.toFixed(3)}
          </span>
        </div>
        <div className="result-item">
          <span className="label">সুস্থ%</span>
          <span className={`value ${getHealthColor(healthy_pct)}`}>
            {healthy_pct}%
          </span>
        </div>
        <div className="result-item">
          <span className="label">চাপগ্রস্ত%</span>
          <span className={`value ${getStressColor(stress_pct)}`}>
            {stress_pct}%
          </span>
        </div>
        <div className="result-item">
          <span className="label">নগ্ন%</span>
          <span className={`value ${getStressColor(bare_pct)}`}>
            {bare_pct}%
          </span>
        </div>
        <div className="result-item full-width">
          <span className="label">মোট হেক্টর</span>
          <span className="value blue">{area_ha} হেক্টর</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Map Bounds Handler
// ============================================

function MapBoundsHandler({ onBoundsChange }) {
  const map = useMap();

  useEffect(() => {
    const updateBounds = () => {
      const b = map.getBounds();
      onBoundsChange?.([
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ]);
    };

    updateBounds();
    map.on("moveend", updateBounds);
    return () => map.off("moveend", updateBounds);
  }, [map, onBoundsChange]);

  return null;
}

// ============================================
// MAIN MapTab Component
// ============================================

export default function MapTab() {
  // COMMIT 1: NDVI default active
  const [activeLayer, setActiveLayer] = useState("ndvi");
  const [bounds, setBounds] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [pipelineResult, setPipelineResult] = useState(null);

  const currentLayer = LAYERS[activeLayer];
  const isVegetationLayer = activeLayer === "ndvi" || activeLayer === "evi";

  // Memoized tile layer props to prevent unnecessary re-renders
  const tileProps = useMemo(() => {
    const props = {
      key: activeLayer, // Forces remount on layer switch
      url: currentLayer.url,
      attribution: currentLayer.attribution,
      opacity: currentLayer.opacity ?? 1,
    };

    if (currentLayer.wms) {
      props.layers = currentLayer.layers;
      props.format = currentLayer.format;
      props.transparent = currentLayer.transparent;
    }

    return props;
  }, [activeLayer, currentLayer]);

  const handlePipelineSuccess = useCallback((data) => {
    setPipelineResult(data);
  }, []);

  const handlePipelineError = useCallback((err) => {
    console.error("Pipeline failed:", err);
  }, []);

  const closeOverlay = useCallback(() => {
    setPipelineResult(null);
  }, []);

  return (
    <div className="map-tab-container">
      {/* Top Bar */}
      <div className="top-bar">
        <LayerSwitcher activeLayer={activeLayer} onChange={setActiveLayer} />
        <div className="top-actions">
          <button
            className={`legend-toggle ${showLegend ? "active" : ""}`}
            onClick={() => setShowLegend((v) => !v)}
            aria-label="লেজেন্ড টগল করুন"
            title="লেজেন্ড"
          >
            📊
          </button>
          <CloudPipelineButton
            bounds={bounds}
            onSuccess={handlePipelineSuccess}
            onError={handlePipelineError}
          />
        </div>
      </div>

      {/* Result Overlay */}
      <ResultOverlay data={pipelineResult} onClose={closeOverlay} />

      {/* Map */}
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        className="leaflet-map"
        scrollWheelZoom={true}
      >
        <MapBoundsHandler onBoundsChange={setBounds} />

        {/* Base layer: OSM (always under) */}
        <TileLayer
          url={OSM_URL}
          attribution="© OpenStreetMap"
          opacity={isVegetationLayer ? 0.4 : 1}
          zIndex={1}
        />

        {/* Active layer */}
        {currentLayer.wms ? (
          <TileLayer
            {...tileProps}
            zIndex={2}
          />
        ) : (
          <TileLayer
            {...tileProps}
            zIndex={2}
          />
        )}
      </MapContainer>

      {/* NDVI Legend */}
      <NDVILegend visible={showLegend && isVegetationLayer} />
    </div>
  );
}
