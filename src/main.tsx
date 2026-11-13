import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import type { BeforeInstallPromptEvent } from './hooks/usePWAInstall';
import App from './App.tsx';
import './index.css';

// Capture early beforeinstallprompt event before React mounts (matching Records repo pattern)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
  });

  registerSW({
    immediate: true,
    onOfflineReady() {
      // App cached for offline use
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
