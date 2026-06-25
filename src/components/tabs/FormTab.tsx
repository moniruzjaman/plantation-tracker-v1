import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import {
  BD_REGIONS, BD_UPAZILAS, AGE_OPTS, CATEGORIES, SEEDLING_NAMES,
  Submission, SeedlingEntry, loadSubmissions, saveSubmissions
} from '../../data/bdData';

const EMPTY_SEEDLING: SeedlingEntry = { name: '', age: '', count: '', graftingCount: '' };
const NEW_SUBMISSION = (): Submission => ({
  id: '',
  region: '', district: '', upazila: '',
  nurseryName: '', mobile: '',
  caretakerName: '', caretakerMobile: '',
  address: '', geoLocation: '', plantingDate: '', remarks: '',
  fruitSeedlings: [{ ...EMPTY_SEEDLING }],
  forestSeedlings: [{ ...EMPTY_SEEDLING }],
  medicinalSeedlings: [{ ...EMPTY_SEEDLING }],
});

type FormData = Omit<Submission, 'id' | 'submittedAt' | 'synced'>;

interface Props { editTarget?: Submission | null; onEditDone?: () => void }

export default function FormTab({ editTarget, onEditDone }: Props) {
  const [form, setForm] = useState<FormData>({ ...NEW_SUBMISSION() });
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geoLoading, setGeoLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const isEdit = !!editTarget;

  useEffect(() => {
    if (editTarget) {
      setForm({
        region: editTarget.region || '',
        district: editTarget.district || '',
        upazila: editTarget.upazila || '',
        nurseryName: editTarget.nurseryName || '',
        mobile: editTarget.mobile || '',
        caretakerName: editTarget.caretakerName || '',
        caretakerMobile: editTarget.caretakerMobile || '',
        address: editTarget.address || '',
        geoLocation: editTarget.geoLocation || '',
        plantingDate: editTarget.plantingDate || '',
        remarks: editTarget.remarks || '',
        fruitSeedlings: editTarget.fruitSeedlings?.length ? editTarget.fruitSeedlings : [{ ...EMPTY_SEEDLING }],
        forestSeedlings: editTarget.forestSeedlings?.length ? editTarget.forestSeedlings : [{ ...EMPTY_SEEDLING }],
        medicinalSeedlings: editTarget.medicinalSeedlings?.length ? editTarget.medicinalSeedlings : [{ ...EMPTY_SEEDLING }],
      });
      setDistricts(BD_REGIONS[editTarget.region] || []);
      setUpazilas(BD_UPAZILAS[editTarget.district] || []);
    }
  }, [editTarget]);

  const set = (key: keyof FormData, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const onRegionChange = (r: string) => {
    set('region', r);
    set('district', '');
    set('upazila', '');
    setDistricts(BD_REGIONS[r] || []);
    setUpazilas([]);
  };
  const onDistrictChange = (d: string) => {
    set('district', d);
    set('upazila', '');
    setUpazilas(BD_UPAZILAS[d] || []);
  };

  const fetchGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        set('geoLocation', coords);
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=bn,en`)
          .then(r => r.json())
          .then(d => { if (d.display_name) set('address', d.display_name); })
          .catch(() => {})
          .finally(() => setGeoLoading(false));
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const updateSeedling = (cat: string, idx: number, field: keyof SeedlingEntry, val: string) => {
    const key = cat as 'fruitSeedlings' | 'forestSeedlings' | 'medicinalSeedlings';
    const list = [...(form[key] || [])];
    list[idx] = { ...list[idx], [field]: val };
    set(key, list);
  };

  const addSeedling = (cat: string) => {
    const key = cat as 'fruitSeedlings' | 'forestSeedlings' | 'medicinalSeedlings';
    set(key, [...(form[key] || []), { ...EMPTY_SEEDLING }]);
  };

  const removeSeedling = (cat: string, idx: number) => {
    const key = cat as 'fruitSeedlings' | 'forestSeedlings' | 'medicinalSeedlings';
    const list = (form[key] || []).filter((_, i) => i !== idx);
    set(key, list.length ? list : [{ ...EMPTY_SEEDLING }]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.region) e.region = 'অঞ্চল আবশ্যক';
    if (!form.district) e.district = 'জেলা আবশ্যক';
    if (!form.upazila) e.upazila = 'উপজেলা আবশ্যক';
    if (!form.nurseryName.trim()) e.nurseryName = 'রোপণকারীর নাম আবশ্যক';
    if (!form.mobile.trim() || !/^01\d{9}$/.test(form.mobile.trim())) e.mobile = 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)';
    if (form.caretakerMobile && !/^01\d{9}$/.test(form.caretakerMobile)) e.caretakerMobile = 'সঠিক মোবাইল নম্বর দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const allSubs = loadSubmissions();

    if (isEdit && editTarget) {
      const updated = allSubs.map(s => s.id === editTarget.id ? { ...s, ...form, synced: false } : s);
      saveSubmissions(updated);
      showToast('তথ্য সফলভাবে আপডেট হয়েছে!', 'ok');
      if (onEditDone) onEditDone();
    } else {
      const newSub: Submission = {
        ...form,
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        synced: false,
      };
      saveSubmissions([...allSubs, newSub]);
      showToast('তথ্য সফলভাবে সংরক্ষিত হয়েছে!', 'ok');
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({ ...NEW_SUBMISSION() });
    setDistricts([]);
    setUpazilas([]);
    setErrors({});
  };

  const inputCls = (err?: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white transition ${err ? 'border-red-400' : 'border-gray-200'}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white animate-in ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">{isEdit ? '✏️' : '📄'}</span>
        <div>
          <h2 className="font-bold text-base">{isEdit ? 'তথ্য সম্পাদনা' : 'নতুন বৃক্ষরোপণ তথ্য জমা'}</h2>
          <p className="text-green-200 text-xs">০৫ বছরে ২৫ কোটি বৃক্ষরোপণ কর্মসূচি · কৃষি সম্প্রসারণ অধিদপ্তর</p>
        </div>
      </div>

      {/* Section 1: General Info */}
      <fieldset className="border-2 border-green-200 rounded-2xl p-5 bg-white">
        <legend className="bg-green-700 text-white px-4 py-1 rounded-lg text-sm font-bold">১. সাধারণ তথ্য</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {/* Region */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">অঞ্চল <span className="text-red-500">*</span></label>
            <select value={form.region} onChange={e => onRegionChange(e.target.value)} className={inputCls(errors.region)}>
              <option value="">অঞ্চল নির্বাচন করুন</option>
              {Object.keys(BD_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.region && <p className="text-red-500 text-xs mt-0.5">{errors.region}</p>}
          </div>
          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">জেলা <span className="text-red-500">*</span></label>
            <select value={form.district} onChange={e => onDistrictChange(e.target.value)} className={inputCls(errors.district)} disabled={!districts.length}>
              <option value="">জেলা নির্বাচন করুন</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.district && <p className="text-red-500 text-xs mt-0.5">{errors.district}</p>}
          </div>
          {/* Upazila */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">উপজেলা <span className="text-red-500">*</span></label>
            <select value={form.upazila} onChange={e => set('upazila', e.target.value)} className={inputCls(errors.upazila)} disabled={!upazilas.length}>
              <option value="">উপজেলা নির্বাচন করুন</option>
              {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.upazila && <p className="text-red-500 text-xs mt-0.5">{errors.upazila}</p>}
          </div>
          {/* Nursery Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">রোপণকারীর নাম <span className="text-red-500">*</span></label>
            <input value={form.nurseryName} onChange={e => set('nurseryName', e.target.value)} placeholder="রোপণকারীর নাম লিখুন" className={inputCls(errors.nurseryName)} />
            {errors.nurseryName && <p className="text-red-500 text-xs mt-0.5">{errors.nurseryName}</p>}
          </div>
          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">মোবাইল নম্বর <span className="text-red-500">*</span></label>
            <input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="01XXXXXXXXX" maxLength={11} inputMode="numeric" className={inputCls(errors.mobile)} />
            {errors.mobile && <p className="text-red-500 text-xs mt-0.5">{errors.mobile}</p>}
          </div>
          {/* Caretaker Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">মনিটরিং অফিসারের নাম</label>
            <input value={form.caretakerName} onChange={e => set('caretakerName', e.target.value)} placeholder="তদারককারীর নাম" className={inputCls()} />
          </div>
          {/* Caretaker Mobile */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">মনিটরিং অফিসারের মোবাইল</label>
            <input value={form.caretakerMobile} onChange={e => set('caretakerMobile', e.target.value)} placeholder="01XXXXXXXXX" maxLength={11} inputMode="numeric" className={inputCls(errors.caretakerMobile)} />
            {errors.caretakerMobile && <p className="text-red-500 text-xs mt-0.5">{errors.caretakerMobile}</p>}
          </div>
          {/* Planting Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">রোপণের তারিখ</label>
            <input type="date" value={form.plantingDate} onChange={e => set('plantingDate', e.target.value)} className={inputCls()} />
          </div>
          {/* Geo Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              জিও লোকেশন
              <button type="button" onClick={fetchGeo} disabled={geoLoading} className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium hover:bg-green-100 transition disabled:opacity-60">
                <MapPin className="w-3 h-3" />
                {geoLoading ? 'লোড হচ্ছে...' : 'স্বয়ংক্রিয়'}
              </button>
            </label>
            <input value={form.geoLocation} onChange={e => set('geoLocation', e.target.value)} placeholder="অক্ষাংশ, দ্রাঘিমাংশ" className={inputCls()} />
          </div>
          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">রোপণকৃত বৃক্ষের অবস্থান</label>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="বৃক্ষ রোপণের স্থানের বিবরণ লিখুন" className={inputCls()} />
          </div>
          {/* Remarks */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">মন্তব্য</label>
            <input value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="মন্তব্য (যদি থাকে)" className={inputCls()} />
          </div>
        </div>
      </fieldset>

      {/* Seedling Sections */}
      {CATEGORIES.map(cat => {
        const key = cat.key as 'fruitSeedlings' | 'forestSeedlings' | 'medicinalSeedlings';
        const entries = form[key] || [];
        const names = SEEDLING_NAMES[cat.key] || [];
        return (
          <fieldset key={cat.key} className="border-2 rounded-2xl p-5 bg-white" style={{ borderColor: cat.border, background: cat.bg + '66' }}>
            <legend className="px-3 py-1 rounded-lg text-white text-sm font-bold" style={{ background: cat.legend }}>
              {cat.label}
            </legend>
            <div className="space-y-3 mt-3">
              {entries.map((entry, idx) => (
                <div key={idx} className="bg-white rounded-xl border p-3 relative" style={{ borderColor: cat.border }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-medium">চারার নাম</label>
                      <select value={entry.name} onChange={e => updateSeedling(cat.key, idx, 'name', e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-green-400">
                        <option value="">নির্বাচন করুন</option>
                        {names.map(n => <option key={n} value={n}>{n}</option>)}
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-medium">বয়স</label>
                      <select value={entry.age} onChange={e => updateSeedling(cat.key, idx, 'age', e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-green-400">
                        {AGE_OPTS.map(a => <option key={a} value={a}>{a || 'বয়স নির্বাচন'}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-medium">চারার সংখ্যা</label>
                      <input type="number" min="0" value={entry.count} onChange={e => updateSeedling(cat.key, idx, 'count', e.target.value)} placeholder="০" className="w-full border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1 font-medium">কলমের সংখ্যা</label>
                      <input type="number" min="0" value={entry.graftingCount} onChange={e => updateSeedling(cat.key, idx, 'graftingCount', e.target.value)} placeholder="০" className="w-full border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-green-400" />
                    </div>
                  </div>
                  {entries.length > 1 && (
                    <button type="button" onClick={() => removeSeedling(cat.key, idx)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addSeedling(cat.key)} className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-white/80 transition" style={{ borderColor: cat.border }}>
                <Plus className="w-3.5 h-3.5" /> আরেকটি যোগ করুন
              </button>
            </div>
          </fieldset>
        );
      })}

      {/* Submit / Reset Buttons */}
      <div className="flex gap-3 justify-center pb-6">
        <button type="button" onClick={handleSubmit} className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition">
          {isEdit ? '✅ আপডেট করুন' : '📤 তথ্য জমা দিন'}
        </button>
        {isEdit ? (
          <button type="button" onClick={onEditDone} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition">
            বাতিল
          </button>
        ) : (
          <button type="button" onClick={resetForm} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> পুনরায় শুরু
          </button>
        )}
      </div>
    </div>
  );
}
