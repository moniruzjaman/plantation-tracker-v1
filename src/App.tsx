/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import NetworkStatus, { NetworkStatusData } from './components/NetworkStatus';
import GeolocationIndicator, { GeoState } from './components/GeolocationIndicator';
import WelcomeModal from './components/WelcomeModal';
import PWAInstaller from './components/PWAInstaller';
import SyncToast from './components/SyncToast';
import OfflinePlantationDashboard, { Submission } from './components/OfflinePlantationDashboard';
import MobileControlCenter from './components/MobileControlCenter';

export default function App() {
  const [networkState, setNetworkState] = useState<NetworkStatusData | null>(null);
  const [geoState, setGeoState] = useState<GeoState | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

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
      <iframe 
        src="legacy-nursery.html" 
        style={{ display: 'block', width: '100%', height: '100%', border: 'none' }}
        title="Plantation Form" 
        allow="geolocation"
      />
    </div>
  );
}
