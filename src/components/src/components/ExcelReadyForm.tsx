import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, LocateFixed, MapPin, RefreshCw, Save, Satellite, WifiOff } from 'lucide-react';

type PlantName = 'আম' | 'লিচু' | 'কাঁঠাল' | 'মেহগনি' | 'নিম';
type PropagationType = 'Seedling' | 'Grafting';

interface LocationFields {
  latitude: string;
  longitude: string;
  accuracy: string;
  district: string;
  upazila: string;
  union: string;
  village: string;
}

interface PlantMetrics {
  plantName: PlantName;
  variety: string;
  propagationType: PropagationType;
  age: string;
  quantity: string;
}

interface ExcelReadySubmission {
  id: string;
  timestamp: string;
  location: LocationFields;
  plant: PlantMetrics;
  caretakerName: string;
  caretakerMobile: string;
  officerName: string;
  officerMobile: string;
  ndvi: string;
  synced: boolean;
}

const PLANT_VARIETIES: Record<PlantName, string[]> = {
  আম: ['আম্রপালি', 'হাড়িভাঙ্গা', 'কাটিমন', 'বারি-৪'],
  লিচু: ['বোম্বাই', 'চায়না-৩', 'মাদ্রাজি'],
  কাঁঠাল: ['খাজা', 'গালা', 'বারোমাসি'],
  মেহগনি: ['আফ্রিকান', 'দেশি'],
  নিম: ['দেশি নিম', 'বন নিম'],
};

const OFFICER_DIRECTORY: Record<string, { name: string; mobile: string }> = {
  shakil: { name: 'সাকিল আহমেদ', mobile: '01910000001' },
  'mo-101': { name: 'সাকিল আহমেদ', mobile: '01910000001' },
  mithun: { name: 'মিঠুন রায়', mobile: '01710000002' },
  'mo-102': { name: 'মিঠুন রায়', mobile: '01710000002' },
};

const DEFAULT_LOCATION: LocationFields = {
  latitude: '25.8123',
  longitude: '89.8765',
  accuracy: '6',
  district: 'কুড়িগ্রাম',
  upazila: 'ভুরুঙ্গামারী',
  union: 'ছোটখাট',
  village: '৩ নং ওয়ার্ড',
};

const STORAGE_KEY = 'excel_ready_submissions';

function createNdvi(latitude: string, longitude: string) {
  const seed = Math.abs(Math.sin(Number(latitude) + Number(longitude)) * 1000);
  return (0.32 + (seed % 38) / 100).toFixed(2);
}

function toCsvValue(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function readSavedSubmissions(): ExcelReadySubmission[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ExcelReadyForm() {
  const [location, setLocation] = useState<LocationFields>(DEFAULT_LOCATION);
  const [plant, setPlant] = useState<PlantMetrics>({
    plantName: 'আম',
    variety: 'আম্রপালি',
    propagationType: 'Grafting',
    age: '6-12 M',
    quantity: '10',
  });
  const [caretakerName, setCaretakerName] = useState('রহিম উদ্দিন');
  const [caretakerMobile, setCaretakerMobile] = useState('01710000000');
  const [officerSearch, setOfficerSearch] = useState('mo-101');
  const [officerName, setOfficerName] = useState('সাকিল আহমেদ');
  const [officerMobile, setOfficerMobile] = useState('01910000001');
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [lastSaved, setLastSaved] = useState<ExcelReadySubmission | null>(null);

  const timestamp = useMemo(() => new Date().toISOString(), []);
  const ndvi = createNdvi(location.latitude, location.longitude);
  const varieties = PLANT_VARIETIES[plant.plantName];
  const fullAddress = `${location.district}, ${location.upazila}, ${location.union}, ${location.village}`;
  const coordinates = `${location.latitude}, ${location.longitude}`;

  const fetchGps = () => {
    setIsFetchingGps(true);
    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      setIsFetchingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy).toString(),
          district: DEFAULT_LOCATION.district,
          upazila: DEFAULT_LOCATION.upazila,
          union: DEFAULT_LOCATION.union,
          village: DEFAULT_LOCATION.village,
        });
        setIsFetchingGps(false);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setIsFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  };

  const lookupOfficer = (value: string) => {
    setOfficerSearch(value);
    const officer = OFFICER_DIRECTORY[value.trim().toLowerCase()];
    if (officer) {
      setOfficerName(officer.name);
      setOfficerMobile(officer.mobile);
    }
  };

  const saveForSync = () => {
    const submission: ExcelReadySubmission = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      location,
      plant,
      caretakerName,
      caretakerMobile,
      officerName,
      officerMobile,
      ndvi,
      synced: navigator.onLine,
    };
    const submissions = [submission, ...readSavedSubmissions()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    setLastSaved(submission);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const downloadExcelReadyCsv = () => {
    const rows = readSavedSubmissions();
    const exportRows = rows.length ? rows : [
      {
        id: 'preview',
        timestamp,
        location,
        plant,
        caretakerName,
        caretakerMobile,
        officerName,
        officerMobile,
        ndvi,
        synced: false,
      },
    ];
    const headers = ['SL', 'Timestamp', 'Full Address (Dist, Upz, Uni, Vill)', 'Geo-Coordinates', 'Plant Name & Variety', 'Type (Seedling/Graft)', 'Age', 'Qty', 'Caretaker (Name & Cell)', 'Monitoring Officer', 'Base NDVI'];
    const csvRows = [headers.map(toCsvValue).join(',')];
    exportRows.forEach((row, index) => {
      csvRows.push([
        index + 1,
        row.timestamp,
        `${row.location.district}, ${row.location.upazila}, ${row.location.union}, ${row.location.village}`,
        `${row.location.latitude}, ${row.location.longitude}`,
        `${row.plant.plantName} (${row.plant.variety})`,
        row.plant.propagationType,
        row.plant.age,
        row.plant.quantity,
        `${row.caretakerName} (${row.caretakerMobile})`,
        `${row.officerName} (${row.officerMobile})`,
        row.ndvi,
      ].map(toCsvValue).join(','));
    });

    const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantation-excel-ready.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="absolute bottom-4 left-4 right-4 z-40 max-h-[88vh] overflow-auto rounded-3xl border border-emerald-200 bg-white/95 p-4 shadow-2xl backdrop-blur md:left-auto md:w-[440px]" aria-label="Excel ready plantation form">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Task 1 · Excel Ready</p>
          <h2 className="text-xl font-extrabold text-slate-900">স্মার্ট ফর্ম ও অটো-সিঙ্ক</h2>
          <p className="text-xs text-slate-500">GPS, NDVI ও Excel schema একই সাথে প্রস্তুত।</p>
        </div>
        <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">১. জিও-ইনটেলিজেন্স</h3>
            <button onClick={fetchGps} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700">
              {isFetchingGps ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />} GPS ধরুন
            </button>
          </div>
          <div className="mb-2 h-24 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-100 via-lime-100 to-sky-100 p-3 text-xs text-emerald-900">
            <MapPin className="mx-auto mt-2 h-8 w-8 text-rose-500 drop-shadow" />
            <p className="text-center font-semibold">ড্র্যাগযোগ্য ম্যাপ পিন প্রিভিউ · Accuracy {location.accuracy}m</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['latitude', 'longitude', 'district', 'upazila', 'union', 'village'] as const).map((key) => (
              <label key={key} className="text-xs font-semibold text-slate-600">
                {key}
                <input value={location[key]} onChange={(e) => setLocation({ ...location, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-800" />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3">
          <h3 className="mb-2 font-bold text-slate-800">২. উদ্ভিদের তথ্য</h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-600">গাছের নাম
              <select value={plant.plantName} onChange={(e) => setPlant({ ...plant, plantName: e.target.value as PlantName, variety: PLANT_VARIETIES[e.target.value as PlantName][0] })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5">
                {Object.keys(PLANT_VARIETIES).map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">জাত
              <select value={plant.variety} onChange={(e) => setPlant({ ...plant, variety: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5">
                {varieties.map((variety) => <option key={variety}>{variety}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">পদ্ধতি
              <select value={plant.propagationType} onChange={(e) => setPlant({ ...plant, propagationType: e.target.value as PropagationType })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5">
                <option>Seedling</option>
                <option>Grafting</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">বয়স
              <select value={plant.age} onChange={(e) => setPlant({ ...plant, age: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5">
                <option>1-6 M</option><option>6-12 M</option><option>12-18 M</option><option>18+ M</option>
              </select>
            </label>
            <label className="col-span-2 text-xs font-semibold text-slate-600">সংখ্যা
              <input type="number" min="1" value={plant.quantity} onChange={(e) => setPlant({ ...plant, quantity: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3">
          <h3 className="mb-2 font-bold text-slate-800">৩. জনবল ও তদারকি</h3>
          <div className="grid grid-cols-2 gap-2">
            <input aria-label="Caretaker name" value={caretakerName} onChange={(e) => setCaretakerName(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5" />
            <input aria-label="Caretaker mobile" value={caretakerMobile} onChange={(e) => setCaretakerMobile(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5" />
            <input aria-label="Officer id" value={officerSearch} onChange={(e) => lookupOfficer(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5" />
            <input aria-label="Officer mobile" value={`${officerName} (${officerMobile})`} readOnly className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5" />
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-800"><Satellite className="h-4 w-4 text-sky-600" />৪. তারিখ ও NDVI</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-white p-2">Timestamp<br /><b>{timestamp}</b></span>
            <span className="rounded-lg bg-white p-2">Base NDVI<br /><b>{ndvi}</b></span>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-3 text-xs text-white">
          <p className="font-bold text-emerald-300">Excel Preview</p>
          <p>{fullAddress} · {coordinates} · {plant.plantName} ({plant.variety}) · NDVI {ndvi}</p>
        </div>

        {lastSaved && <p className="rounded-xl bg-emerald-100 p-2 text-xs font-semibold text-emerald-800"><WifiOff className="mr-1 inline h-4 w-4" />LocalForage/IndexedDB compatible buffer simulated in localStorage: {lastSaved.synced ? 'synced' : 'queued offline'}.</p>}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={saveForSync} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-700"><Save className="h-4 w-4" />Save & Sink</button>
          <button onClick={downloadExcelReadyCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 font-bold text-emerald-700 hover:bg-emerald-50"><Download className="h-4 w-4" />Download Excel</button>
        </div>
      </div>
    </section>
  );
}
