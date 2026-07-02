/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import NetworkStatus, { NetworkStatusData } from './components/NetworkStatus';
import GeolocationIndicator, { GeoState } from './components/GeolocationIndicator';
import WelcomeModal from './components/WelcomeModal';
import PWAInstaller from './components/PWAInstaller';
import SyncToast from './components/SyncToast';
import OfflinePlantationDashboard, { Submission } from './components/OfflinePlantationDashboard';
import MobileControlCenter from './components/MobileControlCenter';
import AIAssistant from './components/AIAssistant';
import PlantationForm from './components/plantation/PlantationForm';
import { saveSubmission } from './utils/submissionStore';
import type { PlantationSubmission } from './types/plantation';
import { 
  Sparkles, 
  MessageSquareCode, 
  ClipboardList, 
  LayoutDashboard, 
  Map as MapIcon, 
  Database, 
  Lock, 
  Sprout 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Navigation tabs definition
const tabs = [
  { id: 'form', label: 'ফর্ম', icon: ClipboardList },
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'map', label: 'ম্যাপ', icon: MapIcon },
  { id: 'storedData', label: 'আমার তথ্য', icon: Database },
  { id: 'admin', label: 'এডমিন', icon: Lock }
] as const;

export default function App() {
  const [networkState, setNetworkState] = useState<NetworkStatusData | null>(null);
  const [geoState, setGeoState] = useState<GeoState | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialTab, setAiInitialTab] = useState<'chat' | 'diagnose' | undefined>(undefined);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [currentTab, setCurrentTab] = useState<'form' | 'dashboard' | 'map' | 'storedData' | 'admin'>('form');

  // Unified tab switching and syncing function
  const handleTabChange = (tabId: 'form' | 'dashboard' | 'map' | 'storedData' | 'admin') => {
    setCurrentTab(tabId);
    const iframe = document.getElementById('app-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        // Direct property call (same-origin secure execution)
        if (typeof (iframe.contentWindow as any).switchTab === 'function') {
          (iframe.contentWindow as any).switchTab(tabId);
        }
        // postMessage fallback
        iframe.contentWindow.postMessage({
          type: 'switch-tab',
          tab: tabId
        }, '*');
      } catch (err) {
        console.warn("Direct tab switch call failed, sending postMessage:", err);
        try {
          iframe.contentWindow.postMessage({
            type: 'switch-tab',
            tab: tabId
          }, '*');
        } catch (postErr) {
          console.error("Tab switch message dispatch failed:", postErr);
        }
      }
    }
  };

  // Listen to cross-window requests, AI triggers, and rural data saver toggle events from legacy-nursery.html iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'request-location') {
        const iframe = document.getElementById('app-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow && geoState && geoState.coords) {
          iframe.contentWindow.postMessage({
            type: 'device-location',
            coords: {
              latitude: geoState.coords.latitude,
              longitude: geoState.coords.longitude,
              accuracy: geoState.coords.accuracy
            }
          }, '*');
        }
      }

      if (event.data.type === 'tab-changed') {
        const tab = event.data.tab;
        if (['form', 'dashboard', 'map', 'storedData', 'admin'].includes(tab)) {
          setCurrentTab(tab as any);
        }
      }

      if (event.data.type === 'open-ai-assistant') {
        setAiInitialTab(event.data.tab || 'chat');
        setAiInitialPrompt(event.data.prompt || undefined);
        setIsAiOpen(true);
      }

      if (event.data.type === 'rural-data-saver-change') {
        const enabled = event.data.enabled;
        localStorage.setItem('rural_data_saver_active', enabled ? 'true' : 'false');
        // Dispatch storage event so other React hooks/components (like MobileControlCenter) update instantly
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'rural_data_saver_active',
          newValue: enabled ? 'true' : 'false'
        }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [geoState]);

  // Proactively auto-push coordinate updates to the Leaflet map and mini-maps inside the iframe
  useEffect(() => {
    if (geoState && geoState.coords) {
      const iframe = document.getElementById('app-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'device-location',
          coords: {
            latitude: geoState.coords.latitude,
            longitude: geoState.coords.longitude,
            accuracy: geoState.coords.accuracy
          }
        }, '*');
      }
    }
  }, [geoState]);

  const handlePlantationSubmit = (submission: PlantationSubmission) => {
    saveSubmission(submission);
    // TODO: wire into the real sync queue once the Dexie/backend rework
    // lands — see src/utils/submissionStore.ts for the current bridge.
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-slate-50 font-sans" style={{ height: '100vh' }}>
      <NetworkStatus onStateChange={setNetworkState} />
      <GeolocationIndicator onStateChange={setGeoState} />
      <OfflinePlantationDashboard onStateChange={setSubmissions} />
      <MobileControlCenter 
        networkState={networkState} 
        geoState={geoState} 
        submissions={submissions}
        userEmail="mithun.hstu@gmail.com"
      />
      <WelcomeModal />
      <PWAInstaller />
      <SyncToast />

      {/* Modern Top Header with Desktop Navigation */}
      <header className="flex-shrink-0 bg-gradient-to-r from-emerald-800 to-teal-850 text-white shadow-md z-30 relative no-print">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-700/50 rounded-xl border border-emerald-500/30 shadow-inner flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base leading-tight tracking-tight">বৃক্ষরোপণ মনিটরিং ও তথ্য সংগ্রহ</h1>
              <p className="text-[10px] text-emerald-200/90 hidden sm:block font-medium">কৃষি সম্প্রসারণ অধিদপ্তর (DAE) | মোবাইল ডাটা সার্ভিস</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer relative ${
                    isActive 
                      ? 'text-white bg-emerald-700/70 font-bold shadow-inner border border-emerald-600/30' 
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-700/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-200'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-1 left-4 right-4 h-0.5 bg-emerald-300 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 w-full relative overflow-hidden bg-white">
        {/* Native form replaces the legacy iframe form for the 'form' tab.
            Nursery fields dropped, reporting fields match the official
            17-column monthly proforma — see src/types/plantation.ts. */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{ display: currentTab === 'form' ? 'block' : 'none' }}
        >
          <PlantationForm geoState={geoState} onSubmit={handlePlantationSubmit} />
        </div>

        {/* Legacy iframe still serves dashboard / map / storedData / admin
            until those are ported natively too. */}
        <iframe 
          id="app-iframe"
          src="legacy-nursery.html" 
          style={{ display: currentTab === 'form' ? 'none' : 'block', width: '100%', height: '100%', border: 'none' }}
          title="Plantation Dashboard" 
          allow="geolocation"
          onLoad={(e) => {
            try {
              const win = e.currentTarget.contentWindow;
              if (win) {
                (win as any).VITE_GEE_PIPELINE_URL = import.meta.env.VITE_GEE_PIPELINE_URL;
                // Force sync initial view tab on load
                if (typeof (win as any).switchTab === 'function') {
                  (win as any).switchTab(currentTab);
                }
              }
            } catch (err) {
              console.error("Failed to inject env vars:", err);
            }
          }}
        />
      </main>

      {/* Unified Responsive Mobile Bottom Tab Bar */}
      <nav className="md:hidden flex-shrink-0 bg-white border-t border-slate-100/80 shadow-2xl flex items-center justify-around h-16 px-1 z-30 relative no-print pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition active:scale-95 cursor-pointer relative"
            >
              <div className={`p-1.5 rounded-xl transition-colors duration-200 ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 font-semibold transition-colors duration-200 ${isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      {/* Interactive AI Co-Pilot Floating FAB */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 pointer-events-auto">
        <motion.button
          id="aiCoPilotFAB"
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl border transition-all text-xs font-extrabold cursor-pointer ${
            isAiOpen 
              ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' 
              : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 shadow-emerald-500/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </div>

          <Sparkles className="w-4 h-4 shrink-0" />
          
          <span className="font-sans">
            {isAiOpen ? 'সহকারী বন্ধ করুন' : 'এআই সহকারী কো-পাইলট'}
          </span>
        </motion.button>
      </div>

      {/* AI Assistant Modal Backdrop and Panel */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-45"
            />

            {/* AI Assistant container sheet panel */}
            <motion.div
              id="aiAssistantPanel"
              initial={{ opacity: 0, x: 50, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed bottom-36 md:bottom-24 right-4 z-50 w-[92vw] sm:w-[420px] h-[65vh] max-h-[550px] shadow-2xl rounded-2xl overflow-hidden"
            >
              <AIAssistant 
                onClose={() => setIsAiOpen(false)} 
                initialTab={aiInitialTab}
                initialPrompt={aiInitialPrompt}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
