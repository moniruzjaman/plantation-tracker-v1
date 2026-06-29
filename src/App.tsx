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
import { Sparkles, MessageSquareCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [networkState, setNetworkState] = useState<NetworkStatusData | null>(null);
  const [geoState, setGeoState] = useState<GeoState | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialTab, setAiInitialTab] = useState<'chat' | 'diagnose' | undefined>(undefined);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

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

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
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
      
      {/* Interactive AI Co-Pilot Floating FAB */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-auto">
        <motion.button
          id="aiCoPilotFAB"
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl border transition-all text-xs font-extrabold cursor-pointer ${
            isAiOpen 
              ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' 
              : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
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
              className="fixed bottom-20 right-4 z-50 w-[92vw] sm:w-[420px] h-[75vh] max-h-[600px] shadow-2xl rounded-2xl overflow-hidden"
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

      <iframe 
        id="app-iframe"
        src="legacy-nursery.html" 
        style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
        title="Plantation Form" 
        allow="geolocation"
        onLoad={(e) => {
          try {
            const win = e.currentTarget.contentWindow;
            if (win) {
              (win as any).VITE_GEE_PIPELINE_URL = import.meta.env.VITE_GEE_PIPELINE_URL;
            }
          } catch (err) {
            console.error("Failed to inject env vars:", err);
          }
        }}
      />
    </div>
  );
}
