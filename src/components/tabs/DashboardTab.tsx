import { useState, useMemo } from 'react';
import { BarChart3, Download, Search, Pencil, Trash2, RefreshCw, Wifi, Send } from 'lucide-react';
import { Submission, CATEGORIES, BD_REGIONS, countSeedlings, toBn } from '../../data/bdData';

interface Props {
  submissions: Submission[];
  onRemove: (id: string) => void;
  onEditRequest: (sub: Submission) => void;
}

export default function DashboardTab({ submissions, onRemove, onEditRequest }: Props) {
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupResults, setLookupResults] = useState<Submission[] | null>(null);
  const [syncEndpoint, setSyncEndpoint] = useState(() => localStorage.getItem('sync_endpoint') || '');
  const [syncToken, setSyncToken] = useState(() => localStorage.getItem('sync_token') || '');
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [showSync, setShowSync] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'report'>('dashboard');

  const districts = filterRegion ? (BD_REGIONS[filterRegion] || []) : [];

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      if (filterRegion && s.region !== filterRegion) return false;
      if (filterDistrict && s.district !== filterDistrict) return false;
      return true;
    });
  }, [submissions, filterRegion, filterDistrict]);

  const stats = useMemo(() => {
    let totalSeedlings = 0, totalGrafts = 0, fruit = 0, forest = 0, medicinal = 0;
    const nurseries = new Set<string>();
    const regionMap: Record<string, number> = {};
    filtered.forEach(s => {
      const c = countSeedlings(s);
      totalSeedlings += c.total;
      fruit += c.fruit; forest += c.forest; medicinal += c.medicinal;
      nurseries.add(s.nurseryName);
      CATEGORIES.forEach(cat => {
        const list = s[cat.key as keyof Submission] as any[] | undefined;
        if (list) list.forEach(e => { totalGrafts += parseInt(e.graftingCount) || 0; });
      });
      if (s.region) regionMap[s.region] = (regionMap[s.region] || 0) + 1;
    });
    return { total: filtered.length, nurseries: nurseries.size, totalSeedlings, totalGrafts, fruit, forest, medicinal, regionMap };
  }, [filtered]);

  const doLookup = () => {
    if (!lookupMobile.trim()) return;
    setLookupResults(submissions.filter(s => s.mobile === lookupMobile.trim()));
  };

  const exportCSV = () => {
    const headers = ['তারিখ','অঞ্চল','জেলা','উপজেলা','রোপণকারী','মোবাইল','ফলদ','বনজ','ঔষধি','মোট'];
    const rows = filtered.map(s => {
      const c = countSeedlings(s);
      return [
        s.plantingDate || s.submittedAt?.split('T')[0] || '',
        s.region, s.district, s.upazila, s.nurseryName, s.mobile,
        c.fruit, c.forest, c.medicinal, c.total
      ].join(',');
    });
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantation_data.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantation_data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const doSync = async () => {
    if (!syncEndpoint) { setSyncLog(l => [...l, '❌ API Endpoint প্রয়োজন']); return; }
    setSyncLog(['⚡ সিঙ্ক শুরু হচ্ছে...']);
    localStorage.setItem('sync_endpoint', syncEndpoint);
    localStorage.setItem('sync_token', syncToken);
    try {
      const res = await fetch(syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(syncToken ? { Authorization: syncToken } : {}) },
        body: JSON.stringify({ submissions: filtered, timestamp: new Date().toISOString() }),
      });
      setSyncLog(l => [...l, res.ok ? `✅ সফলভাবে সিঙ্ক হয়েছে (${res.status})` : `⚠️ সার্ভার রেসপন্স: ${res.status}`]);
    } catch (err: unknown) {
      setSyncLog(l => [...l, `❌ ত্রুটি: ${err instanceof Error ? err.message : String(err)}`]);
    }
  };

  // Simple SVG Bar Chart
  const regVals = Object.values(stats.regionMap) as number[];
  const maxReg = Math.max(...regVals, 1);
  const regionEntries = (Object.entries(stats.regionMap) as [string, number][]).sort((a,b) => b[1]-a[1]).slice(0,6);

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4" style={{ borderColor: color }}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{toBn(value)}</p>
    </div>
  );

  return (
    <div className="px-4 py-5 space-y-5">
      {/* View Toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {(['dashboard','report'] as const).map(v => (
          <button key={v} onClick={() => setActiveView(v)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeView === v ? 'bg-white text-green-700 shadow' : 'text-gray-500'}`}>
            {v === 'dashboard' ? '📊 ড্যাশবোর্ড' : '📂 রিপোর্ট'}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1"><Search className="w-3.5 h-3.5" /> ফিল্টার করুন</p>
        <div className="flex flex-wrap gap-2">
          <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterDistrict(''); }} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="">সব অঞ্চল</option>
            {Object.keys(BD_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} disabled={!districts.length} className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="">সব জেলা</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(filterRegion || filterDistrict) && (
            <button onClick={() => { setFilterRegion(''); setFilterDistrict(''); }} className="text-xs text-gray-500 hover:text-red-500 px-2 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> রিসেট</button>
          )}
        </div>
      </div>

      {activeView === 'dashboard' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="মোট জমা" value={stats.total} color="#22c55e" />
            <StatCard label="মোট রোপণকারী" value={stats.nurseries} color="#3b82f6" />
            <StatCard label="মোট চারা" value={stats.totalSeedlings} color="#f97316" />
            <StatCard label="মোট কলম" value={stats.totalGrafts} color="#a855f7" />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Region Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-green-600" /> অঞ্চল অনুযায়ী জমা</p>
              {regionEntries.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">কোনো ডাটা নেই</p>
              ) : (
                <div className="space-y-2">
                  {regionEntries.map(([r, v]) => (
                    <div key={r} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-gray-600 truncate shrink-0">{r}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div className="bg-green-600 h-full rounded-full flex items-center pl-2 text-white font-bold transition-all" style={{ width: `${(v / maxReg) * 100}%` }}>
                          {v > 0 && toBn(v)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Donut via SVG */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-4">চারার ধরন অনুযায়ী</p>
              {stats.totalSeedlings === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">কোনো ডাটা নেই</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'ফলদ', val: stats.fruit, color: '#f97316' },
                    { label: 'বনজ', val: stats.forest, color: '#059669' },
                    { label: 'ঔষধি', val: stats.medicinal, color: '#2563eb' },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span style={{ color: item.color }}>{item.label} চারা</span>
                        <span className="text-gray-600">{toBn(item.val)} ({stats.totalSeedlings ? Math.round(item.val / stats.totalSeedlings * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ background: item.color, width: `${stats.totalSeedlings ? (item.val / stats.totalSeedlings) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 p-3 bg-green-50 rounded-xl text-center">
                    <p className="text-xs text-gray-500">মোট চারা + কলম</p>
                    <p className="text-2xl font-extrabold text-green-700">{toBn(stats.totalSeedlings + stats.totalGrafts)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* National Goal Progress */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-amber-800 text-sm">🎯 জাতীয় লক্ষ্যমাত্রা অগ্রগতি (৫ বছরে ২৫ কোটি বৃক্ষ)</p>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{((stats.totalSeedlings / 250000000) * 100).toFixed(4)}%</span>
            </div>
            <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min((stats.totalSeedlings / 250000000) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">আপনার রেকর্ড: {toBn(stats.totalSeedlings)} চারা · লক্ষ্য: ২৫,০০,০০,০০০ চারা</p>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b flex-wrap gap-2">
              <p className="font-bold text-gray-700 text-sm">📋 বিস্তারিত তথ্য ({toBn(filtered.length)} টি)</p>
              <div className="flex gap-2">
                <button onClick={exportCSV} className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={exportJSON} className="flex items-center gap-1 bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-700 transition">
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
              </div>
            </div>
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">কোনো তথ্য পাওয়া যায়নি</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#','তারিখ','জেলা','উপজেলা','রোপণকারী','ফলদ','বনজ','ঔষধি','মোট',''].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => {
                      const c = countSeedlings(s);
                      return (
                        <tr key={s.id} className="border-t hover:bg-gray-50 transition">
                          <td className="px-3 py-2 text-gray-400">{toBn(i + 1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-600">{s.plantingDate || s.submittedAt?.split('T')[0] || '-'}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{s.district}</td>
                          <td className="px-3 py-2 text-gray-600">{s.upazila}</td>
                          <td className="px-3 py-2 text-gray-700">{s.nurseryName}</td>
                          <td className="px-3 py-2 font-semibold text-orange-600">{toBn(c.fruit)}</td>
                          <td className="px-3 py-2 font-semibold text-emerald-700">{toBn(c.forest)}</td>
                          <td className="px-3 py-2 font-semibold text-blue-600">{toBn(c.medicinal)}</td>
                          <td className="px-3 py-2 font-bold text-green-700">{toBn(c.total)}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button onClick={() => onEditRequest(s)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { if (confirm('এই তথ্যটি মুছে ফেলবেন?')) onRemove(s.id); }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* KoBo Sync Center */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-xl text-xl">🔄</div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">KoBo / Server সিঙ্ক সেন্টার</h3>
                <p className="text-xs text-gray-500">মোবাইলে সংগৃহীত ডাটা সরাসরি API-তে পাঠান</p>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-0.5">API Endpoint *</label>
                <input value={syncEndpoint} onChange={e => setSyncEndpoint(e.target.value)} placeholder="https://yourserver.com/api/sync" className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-green-400 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-0.5">Token (ঐচ্ছিক)</label>
                <input type="password" value={syncToken} onChange={e => setSyncToken(e.target.value)} placeholder="Bearer token..." className="w-full border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-green-400 bg-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={doSync} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                <Send className="w-3.5 h-3.5" /> ডাটা সিঙ্ক করুন
              </button>
              <button onClick={() => setSyncLog([])} className="text-gray-500 text-xs px-3 py-2 border rounded-lg hover:bg-gray-50 transition">
                লগ পরিষ্কার
              </button>
            </div>
            {syncLog.length > 0 && (
              <div className="mt-3 bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400 space-y-0.5 max-h-24 overflow-y-auto">
                {syncLog.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}
          </div>
        </>
      )}

      {/* Report Tab - Mobile lookup */}
      {activeView === 'report' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📱</span>
              <div>
                <h2 className="font-bold text-gray-800 text-base">আপনার তথ্য খুঁজুন</h2>
                <p className="text-xs text-gray-500">মোবাইল নম্বর দিয়ে জমা দেওয়া তথ্য দেখুন, সম্পাদনা বা মুছুন</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input value={lookupMobile} onChange={e => setLookupMobile(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLookup()} maxLength={11} inputMode="numeric" placeholder="মোবাইল নম্বর (01XXXXXXXXX)" className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              <button onClick={doLookup} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">🔍 খুঁজুন</button>
            </div>
          </div>

          {lookupResults !== null && (
            <div className="space-y-3">
              {lookupResults.length === 0 ? (
                <div className="text-center text-gray-400 py-8 bg-white rounded-xl">এই মোবাইল নম্বরে কোনো তথ্য পাওয়া যায়নি।</div>
              ) : (
                lookupResults.map(s => {
                  const c = countSeedlings(s);
                  return (
                    <div key={s.id} className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-green-700">{s.nurseryName}</p>
                          <p className="text-xs text-gray-500">{s.region} › {s.district} › {s.upazila}</p>
                          <p className="text-xs text-gray-400">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('bn-BD') : '-'}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => onEditRequest(s)} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-semibold hover:bg-blue-200 transition">
                            <Pencil className="w-3 h-3" /> সম্পাদনা
                          </button>
                          <button onClick={() => { if (confirm('এই তথ্যটি মুছে ফেলবেন?')) { onRemove(s.id); setLookupResults(r => r ? r.filter(x => x.id !== s.id) : null); } }} className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-lg font-semibold hover:bg-red-200 transition">
                            <Trash2 className="w-3 h-3" /> মুছুন
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-orange-50 rounded-lg p-2 text-center"><p className="font-bold text-orange-600">{toBn(c.fruit)}</p><p className="text-gray-500">ফলদ</p></div>
                        <div className="bg-green-50 rounded-lg p-2 text-center"><p className="font-bold text-emerald-700">{toBn(c.forest)}</p><p className="text-gray-500">বনজ</p></div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center"><p className="font-bold text-blue-600">{toBn(c.medicinal)}</p><p className="text-gray-500">ঔষধি</p></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* All records list */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <p className="font-bold text-gray-700 text-sm">সমস্ত রেকর্ড ({toBn(filtered.length)} টি)</p>
              <button onClick={exportCSV} className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold"><Download className="w-3.5 h-3.5" /> CSV</button>
            </div>
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">কোনো তথ্য নেই</p>
            ) : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {filtered.map((s, i) => {
                  const c = countSeedlings(s);
                  return (
                    <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-xs">
                      <div>
                        <span className="text-gray-400 mr-2">{toBn(i + 1)}.</span>
                        <span className="font-semibold text-gray-800">{s.nurseryName}</span>
                        <span className="text-gray-400 ml-1">· {s.district}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-700">{toBn(c.total)} চারা</span>
                        <button onClick={() => onEditRequest(s)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => { if (confirm('মুছে ফেলবেন?')) onRemove(s.id); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
