import { useEffect, useRef, useState, useMemo } from 'react';
import { Layers, Crosshair, TreePine, MapPin } from 'lucide-react';
import { Submission, BD_REGIONS, countSeedlings, toBn } from '../../data/bdData';

type TileKey = 'osm' | 'satellite' | 'topo';

const TILES: Record<TileKey, { url: string; attr: string; label: string; icon: string }> = {
  osm:       { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                      attr: '© OpenStreetMap', label: 'রোড ম্যাপ',  icon: '🗺️' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',           attr: '© Esri',          label: 'স্যাটেলাইট', icon: '🛰️' },
  topo:      { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                                                        attr: '© OpenTopoMap',   label: 'টোপো',        icon: '⛰️' },
};

interface Props { submissions: Submission[] }

function parseGeo(geo: string): [number, number] | null {
  const m = geo.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export default function MapTab({ submissions }: Props) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const leafletRef    = useRef<any>(null);
  const markersRef    = useRef<any>(null);
  const tileRef       = useRef<any>(null);
  const myMarkerRef   = useRef<any>(null);
  const overlayActive = useRef(false);

  const [filterRegion,   setFilterRegion]   = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [activeTile,     setActiveTile]     = useState<TileKey>('osm');
  const [mapReady,       setMapReady]       = useState(false);
  const [geoLocating,    setGeoLocating]    = useState(false);
  const [mapStats,       setMapStats]       = useState({ count: 0, total: 0 });
  const [mapLocked,      setMapLocked]      = useState(true); // mobile scroll guard

  const districts = filterRegion ? (BD_REGIONS[filterRegion] || []) : [];

  const filteredSubs = useMemo(() => submissions.filter(s => {
    if (filterRegion   && s.region   !== filterRegion)   return false;
    if (filterDistrict && s.district !== filterDistrict) return false;
    return !!s.geoLocation;
  }), [submissions, filterRegion, filterDistrict]);

  /* ── Init Leaflet once ── */
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [23.8103, 90.4125],
      zoom: 7,
      zoomControl: false,
      // Disable drag on touch until user taps — prevents scroll hijack
      dragging: !L.Browser.mobile,
      tap: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(TILES.osm.url, { attribution: TILES.osm.attr, maxZoom: 19 });
    tile.addTo(map);
    tileRef.current  = tile;

    markersRef.current = L.layerGroup().addTo(map);
    leafletRef.current = map;
    setMapReady(true);

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  /* ── Unlock map on tap (mobile scroll guard) ── */
  const unlockMap = () => {
    if (!mapLocked || !leafletRef.current) return;
    const L = (window as any).L;
    if (L?.Browser.mobile) leafletRef.current.dragging.enable();
    setMapLocked(false);
  };

  const relockMap = () => {
    if (!leafletRef.current) return;
    const L = (window as any).L;
    if (L?.Browser.mobile) leafletRef.current.dragging.disable();
    setMapLocked(true);
  };

  /* ── Update markers when data / filter changes ── */
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    markersRef.current.clearLayers();
    let count = 0, total = 0;
    const coords: [number, number][] = [];

    filteredSubs.forEach(s => {
      const c = countSeedlings(s);
      const geo = s.geoLocation ? parseGeo(s.geoLocation) : null;
      if (!geo) return;
      coords.push(geo);
      total += c.total;
      count++;

      const color  = c.total > 10000 ? '#f97316' : c.total > 5000 ? '#3b82f6' : '#059669';
      const radius = c.total > 10000 ? 14        : c.total > 5000 ? 10        : 7;

      const marker = L.circleMarker(geo, { radius, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85 });
      marker.bindPopup(`
        <div style="font-family:'Noto Sans Bengali',sans-serif;min-width:200px">
          <div style="background:#15803d;color:#fff;padding:8px 12px;border-radius:8px 8px 0 0;margin:-10px -10px 8px;font-weight:700;font-size:13px">🌱 ${s.nurseryName}</div>
          <div style="font-size:12px;color:#374151;line-height:1.6">
            <p><strong>অঞ্চল:</strong> ${s.region} › ${s.district} › ${s.upazila}</p>
            <p><strong>মোবাইল:</strong> ${s.mobile}</p>
            ${s.plantingDate ? `<p><strong>তারিখ:</strong> ${s.plantingDate}</p>` : ''}
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">
              <div style="background:#fff7ed;border-radius:6px;padding:6px;text-align:center"><p style="color:#ea580c;font-weight:700;font-size:14px">${c.fruit}</p><p style="font-size:10px;color:#6b7280">ফলদ</p></div>
              <div style="background:#ecfdf5;border-radius:6px;padding:6px;text-align:center"><p style="color:#047857;font-weight:700;font-size:14px">${c.forest}</p><p style="font-size:10px;color:#6b7280">বনজ</p></div>
              <div style="background:#eff6ff;border-radius:6px;padding:6px;text-align:center"><p style="color:#1d4ed8;font-weight:700;font-size:14px">${c.medicinal}</p><p style="font-size:10px;color:#6b7280">ঔষধি</p></div>
            </div>
            <p style="text-align:center;margin-top:6px;font-weight:700;color:#15803d">মোট: ${c.total} চারা</p>
            ${s.address ? `<p style="font-size:10px;color:#9ca3af;margin-top:4px">📍 ${s.address.slice(0,80)}${s.address.length>80?'...':''}</p>` : ''}
          </div>
        </div>`, { maxWidth: 260 });
      markersRef.current.addLayer(marker);
    });

    setMapStats({ count, total });

    if (coords.length > 0) {
      try { leafletRef.current.fitBounds(L.latLngBounds(coords), { padding: [30, 30], maxZoom: 14 }); } catch {}
    }
  }, [filteredSubs, mapReady]);

  /* ── Switch tile layer ── */
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !tileRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    leafletRef.current.removeLayer(tileRef.current);
    const t = L.tileLayer(TILES[activeTile].url, { attribution: TILES[activeTile].attr, maxZoom: 19 });
    t.addTo(leafletRef.current);
    tileRef.current = t;
  }, [activeTile]); // intentionally exclude mapReady — runs only on tile change after init

  /* ── Zoom to my location ── */
  const zoomToMe = () => {
    if (!leafletRef.current) return;
    setGeoLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const L = (window as any).L;
        const { latitude: lat, longitude: lng } = pos.coords;
        leafletRef.current.setView([lat, lng], 14);
        if (myMarkerRef.current) { myMarkerRef.current.remove(); }
        myMarkerRef.current = L.marker([lat, lng])
          .bindPopup('<strong>আপনার বর্তমান অবস্থান</strong>').openPopup()
          .addTo(leafletRef.current);
        setGeoLocating(false);
        setMapLocked(false); // auto-unlock when zooming to location
      },
      () => setGeoLocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Controls card */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-green-600" /> রোপণ লোকেশন ম্যাপ
          </p>
          {/* Tile switcher */}
          <div className="flex gap-1">
            {(Object.keys(TILES) as TileKey[]).map(t => (
              <button key={t} onClick={() => setActiveTile(t)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition
                  ${activeTile === t ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <span>{TILES[t].icon}</span>
                <span className="hidden sm:inline">{TILES[t].label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters + locate */}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterDistrict(''); }}
            className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="">সব অঞ্চল</option>
            {Object.keys(BD_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
            disabled={!districts.length}
            className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white disabled:opacity-50">
            <option value="">সব জেলা</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={zoomToMe} disabled={geoLocating}
            className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-60">
            <Crosshair className="w-4 h-4" />
            {geoLocating ? 'খোঁজা হচ্ছে...' : 'আমার অবস্থান'}
          </button>
        </div>

        {/* Stats */}
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
      <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block border-2 border-white shadow-sm" /> ১০,০০০+ চারা</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500   inline-block border-2 border-white shadow-sm" /> ৫,০০০–১০,০০০</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border-2 border-white shadow-sm" /> ৫,০০০ এর কম</span>
      </div>

      {/* ── Map container with mobile scroll guard ── */}
      <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden"
           style={{ height: 'clamp(300px, 55vw, 520px)' }}>
        {/* Leaflet map div */}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Mobile overlay: tap to enable interaction, outside tap re-locks */}
        {mapLocked && (
          <div
            onClick={unlockMap}
            className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] cursor-pointer z-10"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <span>👆</span> ট্যাপ করুন ম্যাপ ব্যবহার করতে
            </div>
          </div>
        )}

        {/* Re-lock button when map is active on mobile */}
        {!mapLocked && (
          <button
            onClick={relockMap}
            className="absolute top-3 left-3 z-[500] bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow flex items-center gap-1 border border-gray-200">
            ✕ স্ক্রোল মোড
          </button>
        )}
      </div>

      {/* No geo data notice */}
      {filteredSubs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center text-sm text-amber-700">
          <TreePine className="w-8 h-8 mx-auto mb-2 opacity-40" />
          ম্যাপে দেখানোর জন্য কোনো জিও লোকেশন সহ তথ্য নেই।
          <span className="text-xs text-gray-500 mt-1 block">ফর্মে "স্বয়ংক্রিয়" বাটন দিয়ে লোকেশন যোগ করুন।</span>
        </div>
      )}

      {/* NDVI / GEE info */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-green-600" />
          <p className="font-bold text-gray-700 text-sm">NDVI / GEE ইন্টিগ্রেশন (পরিকল্পিত)</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Google Earth Engine (GEE) থেকে NDVI ডাটা লেয়ার সংযোগ করে বৃক্ষ রোপণের প্রভাব পর্যবেক্ষণ করা যাবে।
          এই ফিচারটি পরবর্তী আপডেটে যুক্ত হবে।
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Sentinel-2 NDVI', 'Landsat 8/9', 'Canopy Cover', 'Carbon Stock'].map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
