import { useState, useCallback, type JSX } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Cloud, RefreshCw, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import type { GeoState } from '../GeolocationIndicator';

// ---------- Layers ----------
// NASA GIBS (public, no auth) for NDVI/EVI, ArcGIS World Imagery for
// satellite, standard OSM for the base map — same public tile services
// used elsewhere in the codebase (see plantation-tracker's satellite
// layer), no new dependency on a paid tile provider.

type LayerId = 'ndvi' | 'evi' | 'satellite' | 'osm';

const GIBS_DATE = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0]; // GIBS lags a few days

const LAYER_TILES: Record<LayerId, { url: string; attribution: string }> = {
  ndvi: {
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${GIBS_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    attribution: 'NASA GIBS / MODIS Terra NDVI (250m, 8-day)',
  },
  evi: {
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_EVI_8Day/default/${GIBS_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    attribution: 'NASA GIBS / MODIS Terra EVI (250m, 8-day)',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Imagery',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
};

const LAYER_LABELS: Record<LayerId, string> = {
  ndvi: '🌿 NDVI',
  evi: '🍃 EVI',
  satellite: '🛰️ স্যাটেলাইট',
  osm: '🗺️ মানচিত্র',
};

const NDVI_BANDS = [
  { label: 'নগ্ন ভূমি', color: '#c2410c', range: '< 0.1' },
  { label: 'বিরল', color: '#eab308', range: '0.1 – 0.3' },
  { label: 'মধ্যম', color: '#84cc16', range: '0.3 – 0.5' },
  { label: 'ঘন সবুজ', color: '#16a34a', range: '0.5 – 0.7' },
  { label: 'অতি ঘন', color: '#14532d', range: '> 0.7' },
];

// ---------- Pipeline result ----------

interface PipelineResult {
  ndvi_mean: number;
  evi_mean?: number;
  healthy_pct: number;
  stress_pct: number;
  bare_pct: number;
  area_ha: number;
  source?: string; // "demo_estimate" | "gee_analysis" — see server.ts
  ai_analysis?: string;
}

type PipelineState = 'idle' | 'running' | 'success' | 'error';

// ---------- Sub-components ----------

function LayerSwitcher({ active, onChange }: { active: LayerId; onChange: (l: LayerId) => void }) {
  return (
    <div className="absolute top-3 left-3 z-[1000] flex gap-1.5 bg-white/95 backdrop-blur rounded-full p-1 shadow-lg">
      {(Object.keys(LAYER_LABELS) as LayerId[]).map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
            active === id ? 'bg-emerald-700 text-white border border-emerald-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {LAYER_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

function CloudPipelineButton({ state, onRun }: { state: PipelineState; onRun: () => void }) {
  const config: Record<PipelineState, { icon: JSX.Element; ring: string; bg: string }> = {
    idle: { icon: <Cloud size={18} />, ring: '', bg: 'bg-slate-600' },
    running: { icon: <RefreshCw size={18} className="animate-spin" />, ring: 'ring-4 ring-amber-300/60 animate-pulse', bg: 'bg-amber-500' },
    success: { icon: <CheckCircle2 size={18} />, ring: '', bg: 'bg-emerald-600' },
    error: { icon: <AlertTriangle size={18} />, ring: '', bg: 'bg-red-500' },
  };
  const c = config[state];
  return (
    <button
      onClick={onRun}
      disabled={state === 'running'}
      className={`w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-all ${c.bg} ${c.ring}`}
      title="স্যাটেলাইট বিশ্লেষণ চালান"
    >
      {c.icon}
    </button>
  );
}

function ResultOverlay({ result, onClose }: { result: PipelineResult; onClose: () => void }) {
  const isDemo = !result.source || result.source === 'demo_estimate';
  const colorFor = (v: number, goodHigh = true) => {
    const good = goodHigh ? v >= 60 : v <= 15;
    const warn = goodHigh ? v >= 35 : v <= 30;
    return good ? 'text-emerald-600' : warn ? 'text-amber-600' : 'text-red-600';
  };
  return (
    <div className="absolute top-3 right-3 z-[1000] w-56 bg-white/95 backdrop-blur rounded-xl shadow-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-700">বিশ্লেষণ ফলাফল</h4>
        <button onClick={onClose} className="text-gray-400 text-xs">✕</button>
      </div>
      {isDemo && (
        <p className="text-[10px] bg-amber-50 text-amber-700 rounded px-1.5 py-1">
          ⚠️ ডেমো ডেটা — প্রকৃত স্যাটেলাইট বিশ্লেষণ নয়, GEE পাইপলাইন সংযুক্ত হলে বাস্তব মান দেখাবে
        </p>
      )}
      <div className="text-xs space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">গড় NDVI</span><span className="font-semibold">{result.ndvi_mean.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">সুস্থ%</span><span className={`font-semibold ${colorFor(result.healthy_pct, true)}`}>{result.healthy_pct}%</span></div>
        <div className="flex justify-between"><span className="text-gray-500">চাপগ্রস্ত%</span><span className={`font-semibold ${colorFor(result.stress_pct, false)}`}>{result.stress_pct}%</span></div>
        <div className="flex justify-between"><span className="text-gray-500">নগ্ন%</span><span className="font-semibold text-gray-700">{result.bare_pct}%</span></div>
        <div className="flex justify-between"><span className="text-gray-500">মোট হেক্টর</span><span className="font-semibold">{result.area_ha} ha</span></div>
      </div>
      {result.ai_analysis && <p className="text-[10px] text-gray-500 border-t pt-1.5 leading-relaxed">{result.ai_analysis}</p>}
    </div>
  );
}

function NDVILegend({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(true);
  if (!visible) return null;
  return (
    <div className="absolute bottom-4 left-3 z-[1000]">
      {open ? (
        <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-2.5 w-40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-gray-600">NDVI মান</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 text-[10px]">✕</button>
          </div>
          {NDVI_BANDS.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-[10px] py-0.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
              <span className="text-gray-600 flex-1">{b.label}</span>
              <span className="text-gray-400">{b.range}</span>
            </div>
          ))}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="w-9 h-9 bg-white/95 rounded-full shadow-lg flex items-center justify-center">
          <BarChart3 size={16} className="text-gray-600" />
        </button>
      )}
    </div>
  );
}

/** Tracks the current map bounds for the pipeline request body — a
 *  react-leaflet child so it can use the map context via hooks. */
function BoundsTracker({ onBoundsChange }: { onBoundsChange: (b: LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
  });
  return null;
}

// ---------- Main component ----------

interface MapTabProps {
  geoState: GeoState | null;
}

const DEFAULT_CENTER: [number, number] = [25.805, 89.636]; // Kurigram district center, fallback only

export default function MapTab({ geoState }: MapTabProps) {
  const [activeLayer, setActiveLayer] = useState<LayerId>('ndvi');
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);

  const center: [number, number] = geoState?.coords
    ? [geoState.coords.latitude, geoState.coords.longitude]
    : DEFAULT_CENTER;

  const runPipeline = useCallback(async () => {
    setPipelineState('running');
    const timeout = setTimeout(() => setPipelineState((s) => (s === 'running' ? 'error' : s)), 8000);
    try {
      const boundsPayload = bounds
        ? [[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]
        : null;
      const endpoint = import.meta.env.VITE_GEE_PIPELINE_URL || '/api/gee-ndvi';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bounds: boundsPayload,
          date_from: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0],
          indices: ['NDVI', 'EVI', 'LSWI'],
        }),
      });
      if (!res.ok) throw new Error('Pipeline request failed');
      const data = (await res.json()) as PipelineResult;
      setResult(data);
      setPipelineState('success');
    } catch {
      setPipelineState('error');
    } finally {
      clearTimeout(timeout);
      setTimeout(() => setPipelineState('idle'), 8000);
    }
  }, [bounds]);

  const showSatelliteUnderlay = activeLayer === 'ndvi' || activeLayer === 'evi';
  const showLegend = activeLayer === 'ndvi' || activeLayer === 'evi';

  return (
    <div className="relative w-full h-full">
      <MapContainer center={center} zoom={12} className="w-full h-full" zoomControl={false}>
        {showSatelliteUnderlay && (
          <TileLayer
            key="satellite-underlay"
            url={LAYER_TILES.satellite.url}
            attribution={LAYER_TILES.satellite.attribution}
            opacity={0.4}
          />
        )}
        <TileLayer
          key={activeLayer}
          url={LAYER_TILES[activeLayer].url}
          attribution={LAYER_TILES[activeLayer].attribution}
        />
        <BoundsTracker onBoundsChange={setBounds} />
      </MapContainer>

      <LayerSwitcher active={activeLayer} onChange={setActiveLayer} />
      <NDVILegend visible={showLegend} />

      <div className="absolute bottom-4 right-3 z-[1000]">
        <CloudPipelineButton state={pipelineState} onRun={runPipeline} />
      </div>

      {result && pipelineState !== 'running' && (
        <ResultOverlay result={result} onClose={() => setResult(null)} />
      )}
    </div>
  );
}
