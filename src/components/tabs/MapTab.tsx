import { useEffect, useRef, useState } from 'react';
import { Layers, Crosshair, TreePine, MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Submission, BD_REGIONS, countSeedlings, toBn } from '../../data/bdData';

type TileLayer = 'osm' | 'satellite' | 'topo';

const TILE_LAYERS: Record<TileLayer, { url: string; attr: string; label: string; icon: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors',
    label: 'রোড ম্যাপ',
    icon: '🗺️',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri World Imagery',
    label: 'স্যাটেলাইট',
    icon: '🛰️',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '© OpenTopoMap',
    label: 'টোপো',
    icon: '⛰️',
  },
};

interface Props {
  submissions: Submission[];
}

export default function MapTab({ submissions }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [activeTile, setActiveTile] = useState<TileLayer>('osm');
  const [mapReady, setMapReady] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [mapStats, setMapStats] = useState<{ count: number; total: number }>({ count: 0, total: 0 });

  const districts = filterRegion ? (BD_REGIONS[filterRegion] || []) : [];

  const filteredSubs = submissions.filter(s => {
    if (filterRegion && s.region !== filterRegion) return false;
    if (filterDistrict && s.district !== filterDistrict) return false;
    if (!s.geoLocation) return false;
    return true;
  });

  const parseGeo = (geo: string): [number, number] | null => {
    const m = geo.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (!m) return null;
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return [lat, lng];
  };

  // Initialize Leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [23.8103, 90.4125],
      zoom: 7,
      zoomControl: false,
    });

    // Custom zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(TILE_LAYERS.osm.url, { attribution: TILE_LAYERS.osm.attr, maxZoom: 19 });
    tile.addTo(map);
    tileLayerRef.current = tile;

    markersLayerRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    let count = 0, total = 0;
    filteredSubs.forEach(s => {
      const coords = s.geoLocation ? parseGeo(s.geoLocation) : null;
      if (!coords) return;
      const c = countSeedlings(s);
      total += c.total;
      count++;

      // Color by seedling count
      const color = c.total > 10000 ? '#f97316' : c.total > 5000 ? '#3b82f6' : '#059669';
      const radius = c.total > 10000 ? 14 : c.total > 5000 ? 10 : 7;

      const marker = L.circleMarker(coords, {
        radius, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85,
      });

      marker.bindPopup(`
        <div style="font-family:'Noto Sans Bengali',sans-serif;min-width:200px">
          <div style="background:#15803d;color:#fff;padding:8px 12px;border-radius:8px 8px 0 0;margin:-10px -10px 8px;font-weight:700;font-size:13px">
            🌱 ${s.nurseryName}
          </div>
          <div style="font-size:12px;color:#374151;line-height:1.6">
            <p><strong>অঞ্চল:</strong> ${s.region} › ${s.district} › ${s.upazila}</p>
            <p><strong>মোবাইল:</strong> ${s.mobile}</p>
            ${s.plantingDate ? `<p><strong>তারিখ:</strong> ${s.plantingDate}</p>` : ''}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">
              <div style="background:#fff7ed;border-radius:6px;padding:6px;text-align:center">
                <p style="color:#ea580c;font-weight:700;font-size:14px">${c.fruit}</p>
                <p style="font-size:10px;color:#6b7280">ফলদ</p>
              </div>
              <div style="background:#ecfdf5;border-radius:6px;padding:6px;text-align:center">
                <p style="color:#047857;font-weight:700;font-size:14px">${c.forest}</p>
                <p style="font-size:10px;color:#6b7280">বনজ</p>
              </div>
              <div style="background:#eff6ff;border-radius:6px;padding:6px;text-align:center">
                <p style="color:#1d4ed8;font-weight:700;font-size:14px">${c.medicinal}</p>
                <p style="font-size:10px;color:#6b7280">ঔষধি</p>
              </div>
            </div>
            <p style="text-align:center;margin-top:6px;font-weight:700;color:#15803d">মোট: ${c.total} চারা</p>
            ${s.address ? `<p style="font-size:10px;color:#9ca3af;margin-top:4px">📍 ${s.address.slice(0, 80)}${s.address.length > 80 ? '...' : ''}</p>` : ''}
          </div>
        </div>
      `, { maxWidth: 260 });

      layer.addLayer(marker);
    });

    setMapStats({ count, total });
    if (count > 0 && leafletMapRef.current) {
      const allCoords = filteredSubs
        .map(s => s.geoLocation ? parseGeo(s.geoLocation) : null)
        .filter(Boolean) as [number, number][];
      if (allCoords.length) {
        const L2 = (window as any).L;
        try { leafletMapRef.current.fitBounds(L2.latLngBounds(allCoords), { padding: [30, 30], maxZoom: 14 }); } catch {}
      }
    }
  }, [filteredSubs, mapReady]);

  // Change tile layer
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !tileLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    leafletMapRef.current.removeLayer(tileLayerRef.current);
    const t = TILE_LAYERS[activeTile];
    const newTile = L.tileLayer(t.url, { attribution: t.attr, maxZoom: 19 });
    newTile.addTo(leafletMapRef.current);
    tileLayerRef.current = newTile;
  }, [activeTile, mapReady]);

  const zoomToMe = () => {
    if (!leafletMapRef.current) return;
    setGeoLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const L = (window as any).L;
        leafletMapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
        L.marker([pos.coords.latitude, pos.coords.longitude])
          .bindPopup('<strong>আপনার বর্তমান অবস্থান</strong>').openPopup()
          .addTo(leafletMapRef.current);
        setGeoLocating(false);
      },
      () => setGeoLocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-gray-700 text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-green-600" /> রোপণ লোকেশন ম্যাপ</p>
          {/* Tile Layer Switcher */}
          <div className="flex gap-1">
            {(Object.keys(TILE_LAYERS) as TileLayer[]).map(t => (
              <button key={t} onClick={() => setActiveTile(t)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeTile === t ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <span>{TILE_LAYERS[t].icon}</span>
                <span className="hidden sm:inline">{TILE_LAYERS[t].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterDistrict(''); }} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="">সব অঞ্চল</option>
            {Object.keys(BD_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} disabled={!districts.length} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="">সব জেলা</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={zoomToMe} disabled={geoLocating} className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-60">
            <Crosshair className="w-4 h-4" />
            {geoLocating ? 'খোঁজা হচ্ছে...' : 'আমার অবস্থান'}
          </button>
        </div>

        {/* Map Stats */}
        {mapStats.count > 0 && (
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
              <TreePine className="w-3.5 h-3.5" /> {toBn(mapStats.count)} টি লোকেশন চিহ্নিত
            </span>
            <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-semibold">
              মোট {toBn(mapStats.total)} চারা
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block border-2 border-white shadow"></span> ১০,০০০+ চারা</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block border-2 border-white shadow"></span> ৫,০০০–১০,০০০ চারা</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border-2 border-white shadow"></span> ৫,০০০ এর কম চারা</span>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: 500 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {filteredSubs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-sm text-amber-700">
          <TreePine className="w-8 h-8 mx-auto mb-2 opacity-40" />
          ম্যাপে দেখানোর জন্য কোনো জিও লোকেশন সহ তথ্য নেই।<br />
          <span className="text-xs text-gray-500 mt-1 block">ফর্মে তথ্য জমা দেওয়ার সময় "স্বয়ংক্রিয়" বাটন দিয়ে লোকেশন যোগ করুন।</span>
        </div>
      )}

      {/* NDVI Info Panel */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-green-600" />
          <p className="font-bold text-gray-700 text-sm">NDVI / GEE ইন্টিগ্রেশন (পরিকল্পিত)</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">Google Earth Engine (GEE) থেকে NDVI ডাটা লেয়ার সংযোগ করে বৃক্ষ রোপণের প্রভাব পর্যবেক্ষণ করা যাবে। এই ফিচারটি পরবর্তী আপডেটে যুক্ত হবে।</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Sentinel-2 NDVI', 'Landsat 8/9', 'Canopy Cover', 'Carbon Stock'].map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
