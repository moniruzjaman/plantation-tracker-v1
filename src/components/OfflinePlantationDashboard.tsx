import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Leaf, 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  X, 
  Info,
  CheckCircle,
  Clock,
  Settings,
  Flame,
  Globe2
} from 'lucide-react';

export interface Seedling {
  name: string;
  age: string;
  count: string | number;
  graftingCount: string | number;
}

export interface Submission {
  id: string;
  region: string;
  district: string;
  upazila: string;
  nurseryName: string;
  mobile: string;
  caretakerName?: string;
  caretakerMobile?: string;
  address?: string;
  geoLocation?: string;
  plantingDate?: string;
  submittedAt?: string;
  synced?: boolean;
  fruitSeedlings?: Seedling[];
  forestSeedlings?: Seedling[];
  medicinalSeedlings?: Seedling[];
}

interface OfflinePlantationDashboardProps {
  onStateChange?: (submissions: Submission[]) => void;
}

export default function OfflinePlantationDashboard({ onStateChange }: OfflinePlantationDashboardProps = {}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Invoke callback when submissions list updates
  useEffect(() => {
    if (onStateChange) {
      onStateChange(submissions);
    }
  }, [submissions, onStateChange]);

  // Fetch submissions from localStorage
  const fetchSubmissions = () => {
    try {
      const dataStr = localStorage.getItem('nursery_submissions');
      const sheetDataStr = localStorage.getItem('google_sheet_submissions');
      
      let localSubmissions: Submission[] = [];
      let sheetSubmissions: Submission[] = [];
      
      if (dataStr) {
        const parsed = JSON.parse(dataStr) as Submission[];
        if (Array.isArray(parsed)) {
          localSubmissions = parsed;
        }
      }
      
      if (sheetDataStr) {
        const parsed = JSON.parse(sheetDataStr) as Submission[];
        if (Array.isArray(parsed)) {
          sheetSubmissions = parsed;
        }
      }
      
      setSubmissions([...localSubmissions, ...sheetSubmissions]);
      setLastUpdated(new Date().toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US'));
    } catch (e) {
      console.error('Error reading submissions from localStorage:', e);
    }
  };

  useEffect(() => {
    // Initial load
    fetchSubmissions();

    // Set up a periodic poller to catch changes made inside the iframe instantly
    const interval = setInterval(fetchSubmissions, 1500);

    // Listen to storage events from other tabs/frames
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nursery_submissions') {
        fetchSubmissions();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  // Compute stats
  const totalLogs = submissions.length;
  
  let totalSeedlings = 0;
  let fruitCount = 0;
  let forestCount = 0;
  let medicinalCount = 0;

  // Track districts represented in offline submissions
  const districtMap: { [key: string]: number } = {};

  submissions.forEach(s => {
    // Calculate seedling counts
    const countCategory = (list?: Seedling[]) => {
      let sum = 0;
      if (list && Array.isArray(list)) {
        list.forEach(item => {
          sum += (parseInt(item.count as string) || 0) + (parseInt(item.graftingCount as string) || 0);
        });
      }
      return sum;
    };

    const f = countCategory(s.fruitSeedlings);
    const fo = countCategory(s.forestSeedlings);
    const m = countCategory(s.medicinalSeedlings);

    fruitCount += f;
    forestCount += fo;
    medicinalCount += m;
    totalSeedlings += (f + fo + m);

    // Track district stats
    if (s.district) {
      districtMap[s.district] = (districtMap[s.district] || 0) + 1;
    }
  });

  const sortedDistricts = Object.entries(districtMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Translate numbers to Bengali
  const toBnNum = (num: number): string => {
    if (language === 'en') return num.toLocaleString('en-US');
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bnDigits[parseInt(d)]);
  };

  // Text translations
  const t = {
    title: language === 'bn' ? 'অফলাইন ট্র্যাকার' : 'Offline Tracker',
    dashboardTitle: language === 'bn' ? 'অফলাইন ডেটা ড্যাশবোর্ড' : 'Offline Data Dashboard',
    totalBatches: language === 'bn' ? 'মোট অফলাইন রেকর্ড' : 'Total Offline Records',
    totalPlanted: language === 'bn' ? 'মোট রোপণকৃত চারা' : 'Total Seedlings Planted',
    fruit: language === 'bn' ? 'ফলদ চারা' : 'Fruit Seedlings',
    forest: language === 'bn' ? 'বনজ চারা' : 'Forest Seedlings',
    medicinal: language === 'bn' ? 'ঔষধি চারা' : 'Medicinal Seedlings',
    regionalSpread: language === 'bn' ? 'অঞ্চলভিত্তিক বন্টন' : 'District Breakdown',
    noData: language === 'bn' ? 'কোনো ডাটা পাওয়া যায়নি' : 'No records logged yet',
    syncTip: language === 'bn' ? 'সকল ডাটা আপনার ডিভাইসে নিরাপদে অফলাইনে সংরক্ষিত আছে।' : 'All data is securely saved offline in your browser.',
    btnToggle: language === 'bn' ? 'English' : 'বাংলা',
    lastSync: language === 'bn' ? 'আপডেট:' : 'Updated:',
    targetText: language === 'bn' ? 'জাতীয় লক্ষ্যমাত্রা অগ্রগতি' : 'National Goal Progress',
    of: language === 'bn' ? 'এর মধ্যে' : 'of',
  };

  return (
    <div className="hidden md:block absolute top-4 left-4 z-50 pointer-events-none font-sans" id="offlineDashboardContainer">
      <div className="flex flex-col items-start gap-2 pointer-events-auto">
        
        {/* Compact Toggle Button */}
        <motion.button
          id="offlineDashboardToggleBtn"
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border backdrop-blur-sm transition-all text-xs font-semibold cursor-pointer ${
            totalLogs > 0 
              ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700' 
              : 'bg-white/95 border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${totalLogs > 0 ? 'bg-white' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${totalLogs > 0 ? 'bg-white' : 'bg-emerald-500'}`}></span>
          </div>

          <Database className="w-4 h-4 shrink-0 transition-transform duration-300" />
          
          <span>
            {t.title}: <strong className="font-bold">{toBnNum(totalLogs)}</strong> {language === 'bn' ? 'টি' : (totalLogs === 1 ? 'Batch' : 'Batches')}
          </span>
        </motion.button>

        {/* Detailed Information Dashboard Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id="offlineDashboardDetailsPanel"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-80 bg-white border border-gray-150 rounded-2xl p-4 shadow-xl text-gray-800 text-xs flex flex-col gap-3.5"
            >
              {/* Header */}
              <div className="border-b border-gray-100 pb-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm tracking-tight flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    {t.dashboardTitle}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {t.lastSync} {lastUpdated}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Lang Switch */}
                  <button
                    id="dashLangToggle"
                    onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                    className="px-2 py-0.5 rounded border border-gray-200 hover:border-gray-300 active:bg-gray-50 text-[10px] bg-white font-semibold text-gray-600 transition-colors flex items-center gap-1"
                  >
                    <Globe2 className="w-3 h-3 text-gray-400" />
                    {t.btnToggle}
                  </button>
                  {/* Close btn */}
                  <button
                    id="dashCloseBtn"
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-2">
                
                {/* Metric 1: Batches */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-medium text-emerald-800 opacity-80 uppercase tracking-wider">{t.totalBatches}</span>
                  <span className="text-xl font-extrabold text-emerald-700 mt-1">{toBnNum(totalLogs)}</span>
                </div>

                {/* Metric 2: Seedlings */}
                <div className="bg-lime-50/50 border border-lime-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Leaf className="w-4 h-4 text-lime-600 mb-1" />
                  <span className="text-[10px] font-medium text-lime-800 opacity-80 uppercase tracking-wider">{t.totalPlanted}</span>
                  <span className="text-xl font-extrabold text-lime-700 mt-1">{toBnNum(totalSeedlings)}</span>
                </div>

              </div>

              {/* Seedlings Category Progress Meters */}
              <div className="flex flex-col gap-2.5">
                <span className="font-semibold text-gray-700 text-[11px] tracking-wide flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  {language === 'bn' ? 'চারাগাছের প্রকারভেদ' : 'Seedling Varieties'}
                </span>

                {/* Category A: Fruit */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      {t.fruit}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {toBnNum(fruitCount)} {language === 'bn' ? 'টি' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalSeedlings > 0 ? (fruitCount / totalSeedlings) * 105 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Category B: Forest */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      {t.forest}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {toBnNum(forestCount)} {language === 'bn' ? 'টি' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalSeedlings > 0 ? (forestCount / totalSeedlings) * 105 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Category C: Medicinal */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      {t.medicinal}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {toBnNum(medicinalCount)} {language === 'bn' ? 'টি' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalSeedlings > 0 ? (medicinalCount / totalSeedlings) * 105 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Top Districts */}
              {sortedDistricts.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-700 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {t.regionalSpread}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {sortedDistricts.map(([districtName, count]) => (
                      <div key={districtName} className="flex justify-between items-center bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
                        <span className="font-medium text-gray-600 text-xs">{districtName}</span>
                        <span className="font-semibold text-emerald-700 bg-white border border-emerald-100 rounded px-2 py-0.5 text-[10.5px]">
                          {toBnNum(count)} {language === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target progress context */}
              <div className="flex flex-col gap-1 bg-amber-50/40 border border-amber-100/50 p-2.5 rounded-xl text-[10.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    {t.targetText}
                  </span>
                  <span className="font-bold text-amber-800 text-[10px]">
                    {language === 'bn' ? '৫ বছরে ২৫ কোটি' : '250M in 5 Yrs'}
                  </span>
                </div>
                <p className="text-gray-500 leading-relaxed mt-1">
                  {language === 'bn' 
                    ? `আপনার অঞ্চল থেকে ২৫ কোটি গাছ রোপণ কর্মসূচিতে অনন্য অবদান রাখছেন।`
                    : `Your nursery submissions contribute values toward the national 250M plantation target.`}
                </p>
              </div>

              {/* Status and instruction tip */}
              <div className="p-2.5 rounded-xl border bg-emerald-50/50 border-emerald-100/80 text-emerald-800 text-[10.5px] leading-relaxed flex gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <p>{t.syncTip}</p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
