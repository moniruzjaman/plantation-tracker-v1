import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FormTab from './components/tabs/FormTab';
import DashboardTab from './components/tabs/DashboardTab';
import MapTab from './components/tabs/MapTab';
import MyTab from './components/tabs/MyTab';
import NetworkStatus from './components/NetworkStatus';
import GeolocationIndicator from './components/GeolocationIndicator';
import WelcomeModal from './components/WelcomeModal';
import PWAInstaller from './components/PWAInstaller';
import SyncToast from './components/SyncToast';
import { useSubmissions } from './hooks/useSubmissions';
import { toBn } from './data/bdData';
import { FileText, BarChart3, Map, User, Wifi, WifiOff, MapPin, AlertTriangle } from 'lucide-react';

type Tab = 'form' | 'dashboard' | 'map' | 'my';

const TABS: { key: Tab; labelBn: string; icon: React.ReactNode; badgeFn?: (n: number) => string }[] = [
  { key: 'form',      labelBn: 'ফর্ম',       icon: <FileText  className="w-5 h-5" /> },
  { key: 'dashboard', labelBn: 'ড্যাশবোর্ড', icon: <BarChart3  className="w-5 h-5" />, badgeFn: n => n > 0 ? toBn(n) : '' },
  { key: 'map',       labelBn: 'ম্যাপ',       icon: <Map       className="w-5 h-5" /> },
  { key: 'my',        labelBn: 'আমার',        icon: <User      className="w-5 h-5" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [networkState, setNetworkState] = useState<any>(null);
  const [geoState, setGeoState]  = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);

  const { submissions, remove } = useSubmissions();

  const handleEditRequest = (sub: any) => {
    setEditTarget(sub);
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditDone = () => {
    setEditTarget(null);
    setActiveTab('dashboard');
  };

  const isOnline   = networkState?.isOnline ?? true;
  const hasGpsErr  = !!geoState?.error;

  const switchTab = (t: Tab) => {
    setActiveTab(t);
    if (t !== 'form') setEditTarget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NetworkStatus onStateChange={setNetworkState} />
      <GeolocationIndicator onStateChange={setGeoState} />
      <WelcomeModal />
      <PWAInstaller />
      <SyncToast />

      {/* ── HEADER ── */}
      <header className="bg-gradient-to-r from-green-700 via-green-800 to-green-900 text-white shadow-lg sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/logo.svg" alt="DAE" className="w-9 h-9 bg-white rounded-full p-0.5 shadow shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-green-200 text-[10px]">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · কৃষি সম্প্রসারণ অধিদপ্তর</p>
            <h1 className="text-xs sm:text-sm font-bold truncate">"০৫ বছরে ২৫ কোটি বৃক্ষরোপণ" – তথ্য সংগ্রহ পোর্টাল</h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-300" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
            <MapPin className={`w-3.5 h-3.5 ${hasGpsErr ? 'text-red-400' : 'text-emerald-300'}`} />
            {submissions.length > 0 && (
              <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">{toBn(submissions.length)}</span>
            )}
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="max-w-5xl mx-auto hidden md:flex border-t border-green-600/40">
          {TABS.map(tab => {
            const badge = tab.badgeFn?.(submissions.length) || '';
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => switchTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold relative transition-all
                  ${active ? 'text-white bg-white/10' : 'text-green-200 hover:text-white hover:bg-white/5'}`}>
                {tab.icon}
                {tab.labelBn}
                {badge && <span className="absolute top-1.5 right-1/4 bg-amber-400 text-amber-900 text-[9px] font-black px-1 rounded-full">{badge}</span>}
                {active && <motion.div layoutId="nav-bar" className="absolute bottom-0 inset-x-6 h-0.5 bg-white rounded-full" />}
              </button>
            );
          })}
        </nav>

        {!isOnline && (
          <div className="bg-amber-500 text-amber-900 text-center text-xs font-semibold py-1 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> অফলাইন মোড — ডাটা ডিভাইসে সুরক্ষিত
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto pb-20 md:pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'form' && (
            <motion.div key="form" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.15 }}>
              <FormTab editTarget={editTarget} onEditDone={handleEditDone} />
            </motion.div>
          )}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.15 }}>
              <DashboardTab submissions={submissions} onRemove={remove} onEditRequest={handleEditRequest} />
            </motion.div>
          )}
          {activeTab === 'map' && (
            <motion.div key="map" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.15 }}>
              <MapTab submissions={submissions} />
            </motion.div>
          )}
          {activeTab === 'my' && (
            <motion.div key="my" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.15 }}>
              <MyTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-xl z-50 flex no-print">
        {TABS.map(tab => {
          const badge  = tab.badgeFn?.(submissions.length) || '';
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => switchTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold relative transition-all ${active ? 'text-green-700' : 'text-gray-400'}`}>
              <span className={`transition-transform ${active ? 'scale-110' : ''}`}>{tab.icon}</span>
              {tab.labelBn}
              {badge && <span className="absolute top-1 right-2 bg-amber-400 text-amber-900 text-[8px] font-black px-1 rounded-full">{badge}</span>}
              {active && <motion.div layoutId="mob-bar" className="absolute bottom-0 inset-x-4 h-0.5 bg-green-600 rounded-full" />}
            </button>
          );
        })}
      </nav>

      <footer className="bg-green-900 text-green-200 text-center py-3 text-xs hidden md:block no-print">
        কৃষি সম্প্রসারণ অধিদপ্তর | গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ·{' '}
        <a href="mailto:krishiailive@gmail.com" className="underline hover:text-white">krishiailive@gmail.com</a>
        {' · '}&copy; ২০২৬
      </footer>
    </div>
  );
}
